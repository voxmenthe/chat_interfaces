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
      console.log('Python stdout:', data.toString());
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Python stderr:', data.toString());
    });

    process.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      if (code !== 0 || errorOutput) {
        resolve(NextResponse.json({ error: errorOutput || output || 'Unknown error occurred' }, { status: 500 }));
      } else {
        resolve(NextResponse.json({ response: output.trim() }));
      }
    });
  });
}