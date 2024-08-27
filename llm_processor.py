# flake8: noqa E501
import logging
from mlx_lm import load, generate


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LLMProcessor:
    def __init__(self, model_name="mlx-community/Phi-3.5-mini-instruct-8bit"):
        logger.info(f"Loading model: {model_name}")
        self.model, self.tokenizer = load(model_name)
        logger.info("Model loaded successfully")

    def process_input_stream(self, prompt, max_tokens=2048, temp=0.7, top_p=0.87):
        logger.info(f"Processing input: {prompt[:50]}...")
        try:
            generated_text = ""
            for token in generate(self.model, self.tokenizer, prompt, max_tokens=max_tokens, temp=temp, top_p=top_p):
                generated_text += token
                yield token
            logger.info(f"Generated full response: {generated_text[:50]}...")
        except Exception as e:
            logger.error(f"Error in generate function: {str(e)}")
            raise

processor = LLMProcessor()


# Function to be called from the API route
def process_llm_input(input_text):
    try:
        return "".join(processor.process_input_stream(input_text))
    except Exception as e:
        logger.error(f"Error processing input: {str(e)}")
        return f"Error: {str(e)}"
