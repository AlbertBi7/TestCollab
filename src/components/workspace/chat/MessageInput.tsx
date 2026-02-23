"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Smile } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSend(trimmedMessage);
    setMessage("");

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="border-t border-stone-200 bg-white p-4">
      <div className="flex items-end gap-3 bg-stone-50 rounded-3xl px-4 py-2 border border-stone-200 focus-within:border-lime-300 focus-within:ring-2 focus-within:ring-lime-100 transition-all">
        {/* Emoji Button (placeholder) */}
        <button
          type="button"
          className="p-2 text-stone-400 hover:text-stone-600 transition-colors rounded-full hover:bg-stone-100"
          title="Add emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <textarea
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent border-none resize-none focus:outline-none text-stone-900 placeholder:text-stone-400 py-2 max-h-30 text-sm"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className={`p-2 rounded-full transition-all ${
            message.trim() && !disabled
              ? "bg-[#1c1917] text-white hover:bg-stone-800 shadow-md"
              : "bg-stone-200 text-stone-400 cursor-not-allowed"
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {disabled && (
        <p className="text-xs text-stone-400 text-center mt-2">
          Only workspace members can send messages
        </p>
      )}
    </div>
  );
}
