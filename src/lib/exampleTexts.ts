import { useSyncExternalStore } from 'react'
import { loadSettings, subscribe, type ExampleLang } from './storage'

export function getExampleLang(): ExampleLang {
  return loadSettings().exampleLang
}

/** Reactive example-language preference (updates when Settings is saved). */
export function useExampleLang(): ExampleLang {
  return useSyncExternalStore(subscribe, getExampleLang)
}

/**
 * All demo user messages, per language. To add a language (Hindi, Marathi…):
 * extend ExampleLang in storage.ts, then add that key to every entry below —
 * TypeScript will flag any entry you miss.
 */
export const EXAMPLES = {
  tools: {
    wrongItemRefund: {
      hinglish: 'Bhai order QB-8821 pe wrong burger aaya. Refund milega kya? Policy kya hai?',
      english: 'I got the wrong burger in order QB-8821. Can I get a refund? What is the policy?',
    },
    orderStatus: {
      hinglish: 'QB-1102 kab tak aayega? Status batao.',
      english: 'When will QB-1102 arrive? Tell me the status.',
    },
    greeting: {
      hinglish: 'Hi, kaise ho?',
      english: 'Hi, how are you?',
    },
  },
  structuredJson: {
    intent: {
      hinglish: 'Bhai order QB-8821 pe wrong burger aaya. Refund milega kya? Policy kya hai?',
      english: 'I got the wrong burger in order QB-8821. Can I get a refund? What is the policy?',
    },
    classify: {
      hinglish: 'QB-1102 kab tak aayega? 45 min ho gaye, bhookh lagi hai. Order ka kya hua?',
      english: 'When will QB-1102 arrive? It has been 45 minutes and I am hungry. What happened to my order?',
    },
    customerInfo: {
      hinglish: 'Mera order QB-1122 ka kya hua? Mera naam Rahul hai, phone 9876543210. Bahut der ho gayi yaar.',
      english: 'What happened to my order QB-1122? My name is Rahul, phone 9876543210. It is taking very long.',
    },
  },
  memory: {
    intro: {
      hinglish: 'Hi! Mera naam Rahul hai, order id QB-8821',
      english: 'Hi! My name is Rahul, order id QB-8821',
    },
    late: {
      hinglish: 'Order late hai, kya karu?',
      english: 'My order is late, what should I do?',
    },
    refundWhen: {
      hinglish: 'Refund kab milega?',
      english: 'When will I get my refund?',
    },
    whoAmI: {
      hinglish: 'What is my name and order id?',
      english: 'What is my name and order id?',
    },
  },
  agentLoop: {
    wrongItem: {
      hinglish: 'QB-8821 pe wrong burger aaya hai. Refund chahiye.',
      english: 'I got the wrong burger in order QB-8821. I want a refund.',
    },
    lateOrder: {
      hinglish: 'QB-1102 kahan hai? Bahut late hai. Compensation kya milega?',
      english: 'Where is QB-1102? It is very late. What compensation will I get?',
    },
    cancelled: {
      hinglish: 'QB-4400 ka refund status batao, cancel ho gaya tha order.',
      english: 'Tell me the refund status for QB-4400 — the order was cancelled.',
    },
    greeting: {
      hinglish: 'Hi, kaise ho?',
      english: 'Hi, how are you?',
    },
  },
  supportAgent: {
    wrongItem: {
      hinglish: 'QB-8821 pe wrong burger aaya hai. Refund chahiye.',
      english: 'I got the wrong burger in order QB-8821. I want a refund.',
    },
    policyQuestion: {
      hinglish: 'Late delivery pe compensation kya milta hai? Order QB-1102.',
      english: 'What compensation do I get for late delivery? Order QB-1102.',
    },
    angryBigRefund: {
      hinglish: 'Mujhe QB-8821 ke liye ₹2000 refund chahiye abhi! Bahut gandi service hai, sabko bataunga!',
      english: 'I want a ₹2000 refund for QB-8821 right now! Terrible service, I will tell everyone!',
    },
  },
  trace: {
    userMsg: {
      hinglish: 'QB-8821 pe wrong burger aaya. Refund milega kya?',
      english: 'I got the wrong burger in order QB-8821. Can I get a refund?',
    },
    finalAnswer: {
      hinglish:
        '“Ho gaya — refund started for QB-8821. ₹420 will reach you in 3–5 working days. Refund id RF-8821-7731.” The loop ends because the model answered in plain text.',
      english:
        '“Done — refund started for QB-8821. ₹420 will reach you in 3–5 working days. Refund id RF-8821-7731.” The loop ends because the model answered in plain text.',
    },
  },
} satisfies Record<string, Record<string, Record<ExampleLang, string>>>
