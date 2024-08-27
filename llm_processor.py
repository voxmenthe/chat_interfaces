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

    def process_input(self, prompt, max_tokens=2048, temp=0.7, top_p=0.87):
        logger.info(f"Processing input: {prompt[:50]}...")
        prompt = f"Instruction: {prompt}\nResponse:"
        try:
            response = generate(self.model, self.tokenizer, prompt, max_tokens=max_tokens, temp=temp, top_p=top_p)
            logger.info(f"Generated response: {response[:50]}...")
            return response
        except Exception as e:
            logger.error(f"Error in generate function: {str(e)}")
            logger.error(f"Input type: {type(prompt)}, Content: {prompt[:100]}")
            logger.error(f"Tokenizer type: {type(self.tokenizer)}")
            logger.error(f"Model type: {type(self.model)}")
            raise

# Initialize the processor
processor = LLMProcessor()


# Function to be called from the API route
def process_llm_input(input_text):
    try:
        return processor.process_input(input_text)
    except Exception as e:
        logger.error(f"Error processing input: {str(e)}")
        return f"Error: {str(e)}"
