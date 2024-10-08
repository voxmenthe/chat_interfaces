'use client'

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Upload, RefreshCw } from "lucide-react"
import Markdown from 'markdown-to-jsx'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Component() {
  const [input, setInput] = useState('')
  const [conversation, setConversation] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Utility function for smooth scrolling
  const smoothScroll = (element: HTMLElement, target: number) => {
    const start = element.scrollTop
    const change = target - start
    const duration = Math.abs(change) / 0.5 // 2 // 2 pixels per millisecond
    const startTime = performance.now()

    const animateScroll = (currentTime: number) => {
      const elapsedTime = currentTime - startTime
      const progress = Math.min(elapsedTime / duration, 1)
      element.scrollTop = start + change * progress

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
      if (scrollElement) {
        const target = scrollElement.scrollHeight - scrollElement.clientHeight
        smoothScroll(scrollElement, target) // Duration is now calculated based on distance
      }
    }
  }, [conversation])

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setFileContent(content)
        setInput(content)
      }
      reader.readAsText(file)
    }
  }

  const getConversationContext = () => {
    return conversation.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n\n')
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const messageContent = fileContent || input.trim();
    if (!messageContent || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageContent };
    setConversation(prev => [...prev, userMessage]);
    setInput('');
    setFileContent(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...conversation, userMessage] }),
      });

      if (!response.ok) throw new Error('Failed to process input');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage: Message = { role: 'assistant', content: '' };

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);
        assistantMessage.content += chunk;
      }

      setConversation(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing input:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'An error occurred. Please try again.'
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setConversation([]);
    setInput('');
    setFileContent(null);
  };

  // Handle Enter key press
  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col h-screen w-[80%] mx-auto p-6 bg-background">
      <ScrollArea className="flex-grow mb-6 border border-border rounded-lg shadow-lg" ref={scrollAreaRef}>
        <div className="p-6 space-y-6">
          {conversation.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground ml-auto' 
                  : 'bg-card text-card-foreground'
              } max-w-[80%] w-fit animate-fade-in shadow-md`}
            >
              <div className="text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap">
                <Markdown
                  options={{
                    overrides: {
                      p: { props: { className: 'mb-2' } },
                      h1: { props: { className: 'text-2xl font-bold mb-2' } },
                      h2: { props: { className: 'text-xl font-bold mb-2' } },
                      h3: { props: { className: 'text-lg font-bold mb-2' } },
                      ul: { props: { className: 'list-disc list-inside mb-2' } },
                      ol: { props: { className: 'list-decimal list-inside mb-2' } },
                      li: { props: { className: 'ml-4' } },
                      code: { props: { className: 'bg-gray-100 rounded px-1' } },
                      pre: { props: { className: 'bg-gray-100 rounded p-2 mb-2 overflow-x-auto' } },
                    },
                  }}
                >
                  {message.content}
                </Markdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="bg-card p-4 rounded-lg max-w-[80%] w-fit animate-pulse shadow-md">
              <p className="text-sm md:text-base text-card-foreground">Thinking...</p>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex space-x-3 mb-3">
        <Button onClick={handleResetChat} variant="outline" className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" /> Reset Chat
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message here..."
          className="flex-grow text-sm md:text-base resize-none bg-card text-card-foreground"
          rows={3}
        />
        <div className="flex flex-col space-y-2">
          <label htmlFor="file-upload" className="sr-only">Upload file</label>
          <input
            id="file-upload"
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />
          <Button 
            type="button" 
            size="icon" 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10"
            aria-label="Upload file"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button type="submit" size="icon" disabled={isLoading} className="w-10 h-10" aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}