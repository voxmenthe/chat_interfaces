import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(req: Request) {
  const { input } = await req.json();

  return new Promise((resolve) => {
    const process = spawn('python', ['-c', `
import sys
sys.path.append('.')
from llm_processor import process_llm_input
print(process_llm_input(${JSON.stringify(input)}))
    `]);

    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.on('close', (code) => {
      resolve(NextResponse.json({ response: output.trim() }));
    });
  });
}