import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(req: Request) {
  const { input } = await req.json();

  return new Promise((resolve) => {
    const process = spawn('python', ['run_llm.py', input]);

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Python stderr:', data.toString());
    });

    process.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      if (code !== 0) {
        resolve(NextResponse.json({ error: errorOutput || 'Unknown error occurred' }, { status: 500 }));
      } else {
        try {
          const parsedOutput = JSON.parse(output);
          console.log('Python stdout:', parsedOutput.stdout);
          resolve(NextResponse.json({ response: parsedOutput.llm_output }));
        } catch (error) {
          resolve(NextResponse.json({ error: 'Failed to parse Python output' }, { status: 500 }));
        }
      }
    });
  });
}