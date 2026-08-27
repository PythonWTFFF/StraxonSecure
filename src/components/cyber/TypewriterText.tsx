import React, { useState, useEffect } from "react";

interface TypewriterTextProps {
  strings: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  delayBeforeDelete?: number;
  delayBeforeType?: number;
}

export function TypewriterText({
  strings,
  typeSpeed = 40,
  deleteSpeed = 20,
  delayBeforeDelete = 2000,
  delayBeforeType = 500,
}: TypewriterTextProps) {
  const [text, setText] = useState("");
  const [stringIndex, setStringIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const currentString = strings[stringIndex];
    
    if (isDeleting) {
      if (text.length > 0) {
        timeout = setTimeout(() => {
          setText(text.slice(0, -1));
        }, deleteSpeed);
      } else {
        setIsDeleting(false);
        setStringIndex((prev) => (prev + 1) % strings.length);
        timeout = setTimeout(() => {}, delayBeforeType);
      }
    } else {
      if (text.length < currentString.length) {
        timeout = setTimeout(() => {
          setText(currentString.slice(0, text.length + 1));
        }, typeSpeed);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, delayBeforeDelete);
      }
    }
    
    return () => clearTimeout(timeout);
  }, [text, isDeleting, stringIndex, strings, typeSpeed, deleteSpeed, delayBeforeDelete, delayBeforeType]);

  return (
    <span className="relative">
      {text}
      <span className="inline-block w-[6px] h-[1em] ml-1 align-text-bottom bg-[#00f3ff] animate-pulse" />
    </span>
  );
}
