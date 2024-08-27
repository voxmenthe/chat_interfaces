import sys
import logging
import json
from llm_processor import LLMProcessor

# Set up logging to write to stderr
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s', stream=sys.stderr)
logger = logging.getLogger(__name__)

# Initialize the LLM processor
processor = LLMProcessor()

def process_input(input_text):
    logger.debug(f"Received input: {input_text[:100]}...")  # Log the first 100 characters of input
    try:
        first_chunk = True
        for chunk in processor.process_input_stream(input_text):
            if first_chunk:
                chunk = chunk.lstrip()  # Remove leading whitespace
                first_chunk = False
            logger.debug(f"Generated chunk: {chunk[:50]}...")  # Log the first 50 characters of chunk
            print(json.dumps({"llm_output": chunk}), flush=True)
    except Exception as e:
        error_message = f"Error processing input: {str(e)}"
        logger.error(error_message)
        print(json.dumps({"error": error_message}), flush=True)

if __name__ == "__main__":
    logger.info("LLM processor initialized and ready.")
    while True:
        try:
            logger.debug("Waiting for input...")
            input_text = sys.stdin.readline().strip()
            logger.debug(f"Received input line: {input_text[:100]}...")  # Log the first 100 characters
            if input_text.lower() == 'exit':
                break
            if input_text:
                process_input(input_text)
        except EOFError:
            logger.info("Received EOF, exiting.")
            break
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            print(json.dumps({"error": str(e)}), flush=True)

    logger.info("LLM processor shutting down.")