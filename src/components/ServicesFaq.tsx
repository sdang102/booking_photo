'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function ServicesFaq({ faqs }: { faqs: Array<[string, string]> }) {
  const [open, setOpen] = useState(0);
  return <section className="fin-service-faq"><div className="fin-shell"><header><p className="fin-kicker"><span /> Giải đáp thắc mắc</p><h2>Những câu hỏi<br />thường gặp.</h2></header><div>{faqs.map(([question, answer], index) => <article className={open === index ? 'is-open' : ''} key={question}><button type="button" onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}><span>{question}</span><Plus /></button><p>{answer}</p></article>)}</div></div></section>;
}
