import { MemorySaver, StateGraph, START, END, MessagesAnnotation } from "@langchain/langgraph";
import { ChatOllama } from "@langchain/community/chat_models/ollama";

// Using host.docker.internal to access Ollama running on the host machine from within the Docker container.
// Fallback to localhost if running without Docker.
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://host.docker.internal:11434";

const agentModel = new ChatOllama({
    model: "llama3.2:3b",
    baseUrl: ollamaBaseUrl,
    temperature: 0
})

const agentCheckpointer = new MemorySaver();

// Define a simple conversational graph since we are not using tools currently.
// This avoids the 'bindTools' requirement of createReactAgent.
const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => {
        const response = await agentModel.invoke(state.messages);
        return { messages: [response] };
    })
    .addEdge(START, "agent")
    .addEdge("agent", END);

const agent = workflow.compile({
    checkpointer: agentCheckpointer
});

export default agent;