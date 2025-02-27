import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);

export async function getGeminiResponse(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const { response } = await model.generateContent(`
      You are an Oracle Database expert. Provide clear, practical answers using markdown formatting.

      Context: ${prompt}
      User Question: ${prompt}

      Instructions:
      - Start with a brief overview.
      - Provide step-by-step guidance.
      - Include examples, best practices, and common pitfalls.
      - Reference Oracle documentation links if available.

      Response:
    `);
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return `Oracle Database is a powerful, scalable, and secure RDBMS used for managing structured data. It supports SQL (Structured Query Language) and PL/SQL (Procedural Language/SQL) for querying and managing data.Key Features:High Performance & Scalability – Handles large datasets efficiently.
Security & Compliance – Advanced security features like encryption and access control.
Multi-Model Support – Supports relational, JSON, XML, and blockchain data.
High Availability – Features like Oracle Real Application Clusters (RAC) and Data Guard ensure uptime.
Cloud & On-Premise Deployment – Available as Oracle Cloud Database, on-premise, or hybrid cloud.


Oracle Low Code Development
Oracle offers low-code development platforms that allow users to build applications quickly with minimal coding. These platforms provide drag-and-drop interfaces, pre-built components, and automation tools, making app development faster and more accessible.

Oracle APEX (Application Express)
Oracle APEX is a leading low-code platform that enables developers to build secure, scalable, and data-driven applications using just a web browser.

Key Features:
Rapid Development – Create applications with little to no coding.
Built-in Security – Enterprise-grade security features.
Integration with Oracle Database – Seamless connection to Oracle’s powerful database engine.
Scalability – Supports applications from small businesses to large enterprises.
Benefits of Oracle Low-Code Solutions:
✔️ Faster application development and deployment
✔️ Reduced complexity and cost
✔️ Integration with existing Oracle databases and cloud services
✔️ Suitable for both business users and developers`;
  }
}
