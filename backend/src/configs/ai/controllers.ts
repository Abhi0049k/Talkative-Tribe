import { HumanMessage } from "@langchain/core/messages"
import agent from "./agent"

async function chatWithAI(userMessage: { val: string, chat: string }) {
    const response = await agent.invoke(
        { messages: [new HumanMessage(userMessage.val)] },
        { configurable: { thread_id: userMessage.chat } }
    )
    return (response.messages[response.messages.length - 1].content);
}

export { chatWithAI }