import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

let pythonProcess: any = null;

function initializePythonProcess() {
  if (!pythonProcess) {
    console.log("Initializing Python process...");
    pythonProcess = spawn('python', ['run_llm.py']);
    
    pythonProcess.stderr.on('data', (data: Buffer) => {
      console.error('Python stderr:', data.toString());
    });

    pythonProcess.on('close', (code: number) => {
      console.log(`Python process exited with code ${code}`);
      pythonProcess = null;
    });
  }
  return pythonProcess;
}

export async function POST(req: Request) {
  console.log("Received POST request");

  const process = initializePythonProcess();

  const { messages } = await req.json();
  console.log("Received messages:", messages);

  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  const conversationContext = messages.map(m => `${m.role.charAt(0).toUpperCase() + m.role.slice(1)}: ${m.content}`).join('\n');
  const input = `${conversationContext}\nAssistant:`;
  console.log("Sending input to Python process:", input);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let output = '';

      const dataHandler = (data: Buffer) => {
        console.log("Received data from Python process:", data.toString());
        output += data.toString();
        if (output.includes('\n')) {
          const lines = output.split('\n');
          for (const line of lines.slice(0, -1)) {
            if (line) {
              try {
                const parsedOutput = JSON.parse(line);
                if (parsedOutput.llm_output) {
                  controller.enqueue(encoder.encode(parsedOutput.llm_output));
                } else if (parsedOutput.error) {
                  controller.error(new Error(parsedOutput.error));
                  return;
                }
              } catch (error) {
                console.log("Incomplete JSON, continuing to listen");
              }
            }
          }
          output = lines[lines.length - 1];
        }
      };

      process.stdout.on('data', dataHandler);

      process.stdin.write(input + '\n');
      console.log("Sent input to Python process");
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}