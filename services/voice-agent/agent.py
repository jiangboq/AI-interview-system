import logging
import os

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentSession, RoomInputOptions
from livekit.plugins import anthropic, openai, silero

load_dotenv()
logger = logging.getLogger("voice-agent")

SYSTEM_PROMPT = """You are an AI interviewer conducting a professional job interview.
Your role is to:
- Ask thoughtful, role-relevant questions one at a time
- Listen carefully and follow up on interesting points
- Evaluate communication skills and technical depth
- Be encouraging but objective
- Keep responses concise (2-3 sentences max) since this is a voice conversation

Start by greeting the candidate warmly and asking them to introduce themselves."""


class InterviewAgent(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)


async def entrypoint(ctx: agents.JobContext) -> None:
    logger.info("Connecting to room: %s", ctx.room.name)
    await ctx.connect()

    session = AgentSession(
        vad=silero.VAD.load(),
        stt=openai.STT(model="whisper-1"),
        llm=anthropic.LLM(
            model=os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001"),
        ),
        tts=openai.TTS(voice="alloy"),
    )

    await session.start(
        room=ctx.room,
        agent=InterviewAgent(),
        room_input_options=RoomInputOptions(),
    )

    await session.generate_reply(
        instructions="Greet the candidate warmly and ask them to introduce themselves."
    )


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            worker_type=agents.WorkerType.ROOM,
        )
    )
