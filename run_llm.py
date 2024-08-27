import sys
import logging
import json
from io import StringIO
from llm_processor import process_llm_input

# Redirect stdout to a string buffer
stdout_buffer = StringIO()
sys.stdout = stdout_buffer

# Set up logging to write to stderr
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', stream=sys.stderr)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        logger.error("No input provided")
        sys.exit(1)
    
    input_text = sys.argv[1]
    logger.info(f"Received input: {input_text[:50]}...")
    
    try:
        result = process_llm_input(input_text)
        # Capture stdout and reset it
        stdout_output = stdout_buffer.getvalue()
        sys.stdout = sys.__stdout__

        # Prepare the output
        output = {
            "llm_output": result,
            "stdout": stdout_output
        }
        print(json.dumps(output))
    except Exception as e:
        error_message = f"Error processing input: {str(e)}"
        logger.error(error_message)
        print(json.dumps({"error": error_message}))
        sys.exit(1)