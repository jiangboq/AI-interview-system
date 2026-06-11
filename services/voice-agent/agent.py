import json
import logging

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentServer, AgentSession, Agent, inference, room_io, TurnHandlingOptions
from livekit.plugins import ai_coustics, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv()
logger = logging.getLogger("voice-agent")

BASE_SYSTEM_PROMPT = """You are an AI interviewer conducting a professional job interview.
Your role is to:
- Ask thoughtful, role-relevant questions one at a time
- Listen carefully and follow up on interesting points
- Evaluate communication skills and technical depth
- Be encouraging but objective
- Keep responses concise (2-3 sentences max) since this is a voice conversation"""


def build_system_prompt(candidate_name: str | None, job_title: str | None, job_level: str | None) -> str:
    context_lines = []
    if candidate_name:
        context_lines.append(f"The candidate's name is {candidate_name}.")
    if job_title:
        level_str = f" ({job_level} level)" if job_level else ""
        context_lines.append(f"They are interviewing for the position: {job_title}{level_str}.")
    context = ("\n" + "\n".join(context_lines)) if context_lines else ""
    return BASE_SYSTEM_PROMPT + context


class InterviewAgent(Agent):
    def __init__(self, system_prompt: str) -> None:
        super().__init__(instructions=system_prompt)


server = AgentServer()


@server.rtc_session(agent_name="interview-agent")
async def interview_agent(ctx: agents.JobContext):
    logger.info("Connecting to room: %s", ctx.room.name)

    cfg = json.loads(ctx.job.metadata or "{}")
    stt_cfg = cfg.get("stt", {})
    llm_cfg = cfg.get("llm", {})
    tts_cfg = cfg.get("tts", {})
    interview_cfg = cfg.get("interview", {})

    candidate_name = interview_cfg.get("candidate_name")
    job_title = interview_cfg.get("job_title")
    job_level = interview_cfg.get("job_level")

    system_prompt = build_system_prompt(candidate_name, job_title, job_level)
    logger.info("Starting interview for candidate=%s job=%s level=%s", candidate_name, job_title, job_level)

    session = AgentSession(
        stt=inference.STT(
            model=stt_cfg.get("model", "deepgram/nova-3"),
            language=stt_cfg.get("language", "multi"),
        ),
        llm=inference.LLM(
            model=llm_cfg.get("model", "anthropic/claude-haiku-4-5-20251001"),
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

    await session.start(
        room=ctx.room,
        agent=InterviewAgent(system_prompt),
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
