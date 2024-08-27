from mlx_lm import load, generate


class LLMProcessor:
    def __init__(self, model_name="mlx-community/Phi-3.5-mini-instruct-8bit"):
        self.model, self.tokenizer = load(model_name)

    def process_input(self, prompt, max_tokens=100, temp=0.7):
        prompt = f"Instruction: {prompt}\nResponse:"
        tokens = generate(self.model, self.tokenizer, prompt, max_tokens=max_tokens, temp=temp)
        return self.tokenizer.decode(tokens)


# Initialize the processor
processor = LLMProcessor()


# Function to be called from the API route
def process_llm_input(input_text):
    return processor.process_input(input_text)