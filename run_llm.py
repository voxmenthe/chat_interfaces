import sys
import logging
from llm_processor import process_llm_input

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        logger.error("No input provided")
        sys.exit(1)
    
    input_text = sys.argv[1]
    logger.info(f"Received input: {input_text[:50]}...")
    
    try:
        result = process_llm_input(input_text)
        print(result)
    except Exception as e:
        error_message = f"Error processing input: {str(e)}"
        logger.error(error_message)
        print(error_message)  # This will be captured by the Node.js process
        sys.exit(1)