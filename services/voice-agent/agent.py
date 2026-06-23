import asyncio
import json
import logging
import os
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    RunContext,
    TurnHandlingOptions,
    function_tool,
    inference,
    room_io,
)
from livekit.agents.llm import ChatMessage
from livekit.agents.voice.events import ConversationItemAddedEvent
from livekit.plugins import ai_coustics, openai, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

API_URL = os.getenv("API_URL", "http://localhost:8000")

load_dotenv()
logger = logging.getLogger("voice-agent")

# Total interview budget is ~30 minutes, split across sections below.
SECTION_BUDGETS_SEC = {
    "intro": 3 * 60,
    "project": 12 * 60,
    "behavioral": 10 * 60,
    "qa": 5 * 60,
}
NUDGE_FRACTION = 0.8  # fraction of a section's budget before nudging the agent to wrap up

BASE_GUIDANCE = """You are an AI interviewer conducting a professional job interview.
- Ask thoughtful, role-relevant questions one at a time
- Listen carefully and follow up on interesting points
- Be encouraging but objective
- Keep responses concise (2-3 sentences max) since this is a voice conversation"""


@dataclass
class InterviewState:
    interview_id: str | None
    candidate_name: str | None
    job_title: str | None
    job_level: str | None
    resume: dict | None = None
    current_section: str = "intro"
    section_started_at: float = field(default_factory=time.monotonic)


def _candidate_context_line(state: InterviewState) -> str:
    lines = []
    if state.candidate_name:
        lines.append(f"The candidate's name is {state.candidate_name}.")
    if state.job_title:
        level_str = f" ({state.job_level} level)" if state.job_level else ""
        lines.append(f"They are interviewing for the position: {state.job_title}{level_str}.")
    return "\n".join(lines)


def _format_resume_summary(resume: dict | None) -> str:
    if not resume:
        return ""
    parts = []
    work = resume.get("work_experience") or []
    if work:
        lines = []
        for job in work[:4]:
            company = job.get("company", "")
            title = job.get("title", "")
            desc = "; ".join(job.get("description") or [])
            lines.append(f"- {title} at {company}: {desc}")
        parts.append("Work history:\n" + "\n".join(lines))
    skills = resume.get("skills") or []
    if skills:
        parts.append(f"Skills: {', '.join(skills[:12])}")
    return "\n".join(parts)


async def _fetch_resume(interview_id: str) -> dict | None:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{API_URL}/api/interviews/{interview_id}/resume", timeout=5)
            if resp.status_code == 404:
                return None
            resp.raise_for_status()
            return resp.json()
    except Exception:
        logger.exception("Failed to fetch resume for interview %s", interview_id)
        return None


def _intro_instructions(state: InterviewState) -> str:
    return "\n".join(
        [
            BASE_GUIDANCE,
            _candidate_context_line(state),
            "\nCurrent section: SELF-INTRODUCTION (~3 minutes).",
            "Ask the candidate to introduce themselves and their background.",
            "Once they've given a reasonable self-introduction, call advance_section to move to the project discussion.",
        ]
    )


def _project_instructions(state: InterviewState) -> str:
    resume_summary = _format_resume_summary(state.resume)
    resume_block = (
        f"\nResume context:\n{resume_summary}"
        if resume_summary
        else "\nNo resume on file - ask the candidate to describe a project from memory."
    )
    return "\n".join(
        [
            BASE_GUIDANCE,
            _candidate_context_line(state),
            "\nCurrent section: PROJECT DEEP-DIVE (~12 minutes).",
            "Pick 1-2 notable projects from the candidate's resume and ask in-depth follow-up questions: "
            "their role, technical decisions, challenges, and impact.",
            resume_block,
            "Once you've explored their projects in reasonable depth, call advance_section to move to behavioral questions.",
        ]
    )


def _behavioral_instructions(state: InterviewState) -> str:
    return "\n".join(
        [
            BASE_GUIDANCE,
            _candidate_context_line(state),
            "\nCurrent section: BEHAVIORAL QUESTIONS (~10 minutes).",
            "Ask 2-3 behavioral questions (e.g. conflict resolution, leadership, handling failure) and probe for "
            "specific examples (situation, action, outcome).",
            "Once you've asked enough behavioral questions, call advance_section to let the candidate ask questions.",
        ]
    )


def _qa_instructions(state: InterviewState) -> str:
    return "\n".join(
        [
            BASE_GUIDANCE,
            _candidate_context_line(state),
            "\nCurrent section: CANDIDATE Q&A (~5 minutes).",
            "Invite the candidate to ask you questions about the role, team, or company, and answer them helpfully and honestly.",
            "When the candidate has no more questions or time is up, thank them and close the interview warmly.",
        ]
    )


class SectionAgent(Agent):
    section_name = ""
    budget_sec = 0

    def __init__(self, instructions: str) -> None:
        super().__init__(instructions=instructions)
        self._watchdog_task: asyncio.Task | None = None

    def _next_agent(self) -> "SectionAgent | None":
        return None

    async def on_enter(self) -> None:
        state: InterviewState = self.session.userdata
        state.current_section = self.section_name
        state.section_started_at = time.monotonic()
        self._watchdog_task = asyncio.create_task(self._run_watchdog())

    async def on_exit(self) -> None:
        if self._watchdog_task:
            self._watchdog_task.cancel()

    async def _run_watchdog(self) -> None:
        try:
            await asyncio.sleep(self.budget_sec * NUDGE_FRACTION)
            self.session.generate_reply(
                instructions="You're approaching the time limit for this section. Wrap up your current "
                "line of questioning within the next exchange or two."
            )
            await asyncio.sleep(self.budget_sec * (1 - NUDGE_FRACTION))
            next_agent = self._next_agent()
            if next_agent is not None:
                logger.info("Section %s exceeded its time budget, forcing transition", self.section_name)
                self.session.update_agent(next_agent)
            else:
                self.session.generate_reply(
                    instructions="Time is up. Thank the candidate sincerely and close out the interview now."
                )
        except asyncio.CancelledError:
            pass


class IntroAgent(SectionAgent):
    section_name = "intro"
    budget_sec = SECTION_BUDGETS_SEC["intro"]

    def __init__(self, state: InterviewState) -> None:
        super().__init__(_intro_instructions(state))

    def _next_agent(self) -> SectionAgent:
        return ProjectAgent(self.session.userdata)

    @function_tool
    async def advance_section(self, context: RunContext):
        """Call this once the candidate has given a sufficient self-introduction, to move on to discussing their projects."""
        return ProjectAgent(context.userdata)


class ProjectAgent(SectionAgent):
    section_name = "project"
    budget_sec = SECTION_BUDGETS_SEC["project"]

    def __init__(self, state: InterviewState) -> None:
        super().__init__(_project_instructions(state))

    def _next_agent(self) -> SectionAgent:
        return BehavioralAgent(self.session.userdata)

    @function_tool
    async def advance_section(self, context: RunContext):
        """Call this once you've explored the candidate's projects in reasonable depth, to move on to behavioral questions."""
        return BehavioralAgent(context.userdata)


class BehavioralAgent(SectionAgent):
    section_name = "behavioral"
    budget_sec = SECTION_BUDGETS_SEC["behavioral"]

    def __init__(self, state: InterviewState) -> None:
        super().__init__(_behavioral_instructions(state))

    def _next_agent(self) -> SectionAgent:
        return QAAgent(self.session.userdata)

    @function_tool
    async def advance_section(self, context: RunContext):
        """Call this once you've asked enough behavioral questions, to let the candidate ask their own questions."""
        return QAAgent(context.userdata)


class QAAgent(SectionAgent):
    section_name = "qa"
    budget_sec = SECTION_BUDGETS_SEC["qa"]

    def __init__(self, state: InterviewState) -> None:
        super().__init__(_qa_instructions(state))


server = AgentServer()


@server.rtc_session(agent_name="interview-agent")
async def interview_agent(ctx: agents.JobContext):
    logger.info("Connecting to room: %s", ctx.room.name)

    cfg = json.loads(ctx.job.metadata or "{}")
    interview_id: str | None = cfg.get("interview_id")
    stt_cfg = cfg.get("stt", {})
    llm_cfg = cfg.get("llm", {})
    tts_cfg = cfg.get("tts", {})
    interview_cfg = cfg.get("interview", {})

    candidate_name = interview_cfg.get("candidate_name")
    job_title = interview_cfg.get("job_title")
    job_level = interview_cfg.get("job_level")

    resume = await _fetch_resume(interview_id) if interview_id else None

    state = InterviewState(
        interview_id=interview_id,
        candidate_name=candidate_name,
        job_title=job_title,
        job_level=job_level,
        resume=resume,
    )
    logger.info("Starting interview for candidate=%s job=%s level=%s", candidate_name, job_title, job_level)

    session = AgentSession[InterviewState](
        userdata=state,
        stt=inference.STT(
            model=stt_cfg.get("model", "deepgram/nova-3"),
            language=stt_cfg.get("language", "multi"),
        ),
        llm=openai.LLM(
            model=llm_cfg.get("model", "gpt-4.1-mini"),
        ),
        tts=inference.TTS(
            model=tts_cfg.get("model", "cartesia/sonic-3"),
            voice=tts_cfg.get("voice", "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"),
        ),
        vad=silero.VAD.load(),
        turn_handling=TurnHandlingOptions(
            turn_detection=MultilingualModel(),
        ),
    )

    if interview_id:
        async def _post_turn(speaker: str, text: str, timestamp: str, section: str) -> None:
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        f"{API_URL}/api/transcripts/{interview_id}/turns",
                        json={"speaker": speaker, "text": text, "timestamp": timestamp, "section": section},
                        timeout=5,
                    )
                    resp.raise_for_status()
            except Exception:
                logger.exception("Failed to persist transcript turn for interview %s", interview_id)

        @session.on("conversation_item_added")
        def on_conversation_item_added(event: ConversationItemAddedEvent) -> None:
            if not isinstance(event.item, ChatMessage):
                return
            text = event.item.text_content
            if not text:
                return
            speaker = "agent" if event.item.role == "assistant" else "candidate"
            timestamp = datetime.fromtimestamp(event.item.created_at, tz=timezone.utc).isoformat()
            asyncio.ensure_future(_post_turn(speaker, text, timestamp, state.current_section))

    if interview_id:
        async def _mark_interview_ended() -> None:
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.post(f"{API_URL}/api/interviews/{interview_id}/end", timeout=5)
                    resp.raise_for_status()
            except Exception:
                logger.exception("Failed to mark interview %s as ended", interview_id)

        ctx.add_shutdown_callback(_mark_interview_ended)

    await session.start(
        room=ctx.room,
        agent=IntroAgent(state),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=ai_coustics.audio_enhancement(
                    model=ai_coustics.EnhancerModel.QUAIL_VF_L,
                ),
            ),
        ),
    )

    await ctx.wait_for_participant()

    greeting_name = f", {candidate_name}" if candidate_name else ""
    greeting_job = f" for the {job_title} role" if job_title else ""
    await session.say(
        f"Hello{greeting_name}! Welcome to your AI interview{greeting_job}. "
        "I'll be your interviewer today. When you're ready, please go ahead and introduce yourself."
    )


if __name__ == "__main__":
    agents.cli.run_app(server)
