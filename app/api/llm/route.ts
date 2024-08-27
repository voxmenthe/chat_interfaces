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
      console.log(data.toString()); // This will log all stdout to the terminal
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(data.toString()); // This will log all stderr to the terminal
    });

    process.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python process exited with code ${code}`);
        resolve(NextResponse.json({ error: errorOutput || 'Unknown error occurred' }, { status: 500 }));
      } else {
        resolve(NextResponse.json({ response: output.trim() }));
      }
    });
  });
}