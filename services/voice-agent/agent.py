import logging

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentServer, AgentSession, Agent, inference, room_io, TurnHandlingOptions
from livekit.plugins import ai_coustics, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

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


server = AgentServer()


@server.rtc_session(agent_name="interview-agent")
async def interview_agent(ctx: agents.JobContext):
    logger.info("Connecting to room: %s", ctx.room.name)

    session = AgentSession(
        stt=inference.STT(model="deepgram/nova-3", language="multi"),
        llm=inference.LLM(model="anthropic/claude-haiku-4-5-20251001"),
        tts=inference.TTS(
            model="cartesia/sonic-3",
            voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
        ),
        vad=silero.VAD.load(),
        turn_handling=TurnHandlingOptions(
            turn_detection=MultilingualModel(),
        ),
    )

    await session.start(
        room=ctx.room,
        agent=InterviewAgent(),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=ai_coustics.audio_enhancement(
                    model=ai_coustics.EnhancerModel.QUAIL_VF_L,
                ),
            ),
        ),
    )

    await session.generate_reply(
        instructions="Greet the candidate warmly and ask them to introduce themselves."
    )


if __name__ == "__main__":
    agents.cli.run_app(server)
