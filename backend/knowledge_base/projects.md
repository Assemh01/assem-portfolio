---
category: projects
priority: critical
visibility: recruiter_safe
last_updated: 2026-05-10
---

# Named Project Summary

Primary projects:

- boxMind Flagship Platform
- boxMind Academy
- Financial Intelligence System
- Enterprise Knowledge Assistants
- Speech AI Systems
- Document OCR / Extraction Support

---

# Overview

Assem Alhomsi has built applied AI systems across education, enterprise knowledge retrieval, finance, speech systems, healthcare, legal technology, and computer vision.

His work consistently focused on practical AI engineering rather than isolated model experimentation. Across projects, he worked on retrieval systems, backend APIs, orchestration pipelines, evaluation workflows, deployment infrastructure, and production-oriented AI applications.

Recurring themes across his projects include:

- production-ready AI systems
- retrieval engineering
- RAG pipelines
- backend-first architecture
- orchestration workflows
- grounding and hallucination reduction
- AI infrastructure and deployment
- automation pipelines
- evaluation-driven iteration
- practical business applications of AI

His engineering style emphasizes maintainability, scalability, and building AI systems that integrate into real operational workflows.

---

# boxMind Flagship Platform — Complete Summary

At boxMind, Assem worked on major parts of the company’s flagship production Generative AI platform used across internal and customer-facing AI applications.

His work spanned retrieval systems, model infrastructure, backend APIs, orchestration pipelines, evaluation systems, and deployment workflows.

One major area involved multi-model AI infrastructure. He worked on systems that allowed users to choose between multiple providers and models such as OpenAI, Gemini, LLaMA, Falcon, Qwen, and other hosted or self-hosted LLMs through a unified interface. This included routing logic, inference APIs, model-serving workflows, and infrastructure supporting both hosted and on-prem deployments.

He also built and improved production retrieval systems involving ingestion pipelines, preprocessing, chunking strategies, metadata enrichment, embeddings, vector indexing, semantic retrieval, reranking, and grounding workflows. His work focused heavily on improving retrieval quality, reducing hallucinations, and increasing answer consistency.

The platform also included evaluation and automation systems. He worked with tools such as RAGAS and LangSmith to benchmark retrieval quality, compare prompts and configurations, analyze hallucinations, and iterate on system performance. He also built Airflow-based ingestion and embedding pipelines that automated indexing, preprocessing, and evaluation workflows.

Technologies involved across this work included Python, Flask, Docker, Linux, NVIDIA A100 infrastructure, vLLM, Hugging Face, Milvus, Chroma, FAISS, LangChain, LangGraph, Airflow, and OpenAI APIs.

This work combined backend engineering, infrastructure, retrieval engineering, orchestration, and production AI systems design.

---

# boxMind Flagship Platform — Model Infrastructure

Worked on infrastructure supporting both hosted and self-hosted language models.

Contributions included:

- multi-model selection workflows
- routing between providers
- inference APIs
- model-serving pipelines
- self-hosted deployment support
- hosted API integrations
- latency optimization
- throughput optimization
- deployment reliability improvements
- infrastructure orchestration

Supported model ecosystems including:

- OpenAI
- Gemini
- LLaMA
- Falcon
- Qwen
- other hosted and open-source providers

Stack:

- NVIDIA A100
- vLLM
- Hugging Face
- Python
- Flask
- Docker
- Linux

---

# boxMind Flagship Platform — Retrieval Systems

Built and improved production retrieval systems involving:

- ingestion pipelines
- preprocessing
- chunking strategies
- metadata enrichment
- embeddings
- vector indexing
- semantic retrieval
- reranking
- grounding workflows
- retrieval optimization
- hallucination reduction
- answer quality iteration

Worked with vector systems including:

- Milvus
- Chroma
- FAISS
- Pinecone familiarity

Technical themes:

- retrieval engineering
- grounding
- answer quality improvement
- semantic search optimization
- enterprise knowledge retrieval
- scalable RAG systems

---

# boxMind Flagship Platform — Evaluation Systems

Built evaluation systems focused on retrieval quality and grounded generation.

Worked on:

- retrieval benchmarking
- answer scoring
- hallucination analysis
- groundedness evaluation
- prompt comparison
- hyperparameter experimentation
- iterative quality improvement
- evaluation automation

Tools:

- RAGAS
- LangSmith
- internal benchmarking systems

---

# boxMind Flagship Platform — Automation

Built automation workflows involving:

- Airflow ingestion pipelines
- embedding refresh systems
- scheduled indexing jobs
- preprocessing workflows
- evaluation pipelines
- ingestion orchestration
- automated retrieval workflows

This reduced manual operational overhead and improved consistency across retrieval systems.

---

# boxMind Flagship Platform — Outcome

Improved:

- retrieval quality
- factual grounding
- answer consistency
- operational efficiency
- ingestion automation
- evaluation workflows
- production reliability

---

# boxMind Academy — Complete Summary

boxMind Academy was an AI-powered educational platform focused on robotics and AI learning for K–12 students.

The goal was to create a system that behaved more like an intelligent tutor than a static learning platform. Instead of simply presenting lessons, the platform supported contextual conversations, guided reasoning, adaptive explanations, and AI-assisted learning workflows.

Assem worked across both educational product design and backend AI implementation. He helped design robotics curriculum for students across multiple grade levels while also building the technical systems powering retrieval, tutoring, and conversational learning features.

A major part of the platform involved lesson-scoped retrieval systems. He implemented contextual RAG pipelines that restricted retrieval to lesson-specific material so students received grounded responses tied directly to what they were learning. He also built guided tutoring workflows that explained reasoning step-by-step rather than giving direct answers immediately.

The platform included conversational quiz assistants capable of analyzing mistakes, guiding students toward correct reasoning, and generating adaptive educational explanations.

The work combined backend engineering, retrieval systems, AI UX design, educational reasoning workflows, and conversational AI.

Technologies involved included Python, Flask, MySQL, OpenAI APIs, LangChain, embeddings, RAG pipelines, Docker, and backend APIs.

---

# boxMind Academy — Problem

Traditional educational systems often provide static content, limited personalization, and little interactive reasoning support.

The goal was to build a system that behaves more like an intelligent tutor than a static course platform.

---

# boxMind Academy — What Assem Built

Worked across both product design and technical implementation.

Contributions included:

- robotics curriculum design for K–12 students
- backend lesson architecture
- lesson-scoped retrieval systems
- contextual RAG pipelines
- conversational tutoring workflows
- guided reasoning systems
- adaptive explanation workflows
- quiz assistants
- AI-supported educational interactions
- backend APIs
- deployment support

---

# boxMind Academy — Technical Contributions

Stack:

- Python
- Flask
- MySQL
- OpenAI API
- LangChain
- embeddings
- RAG pipelines
- retrieval systems
- Docker
- backend APIs

Technical themes:

- contextual retrieval
- scoped memory systems
- prompt engineering for pedagogy
- backend orchestration
- AI UX design
- educational AI workflows
- conversational tutoring systems

---

# boxMind Academy — Outcome

Enabled:

- personalized tutoring
- guided reasoning
- AI-assisted learning
- scalable educational workflows
- adaptive student support
- interactive educational experiences

---

# Financial Intelligence System — Complete Summary

This project focused on building a natural-language interface for querying financial transaction data.

The goal was to reduce the dependency on technical analysts who understood database schemas, SQL syntax, and financial data structures. Instead of manually writing SQL queries, users could ask business questions conversationally and receive structured responses generated through AI workflows.

Assem worked on multiple parts of the system, including schema grounding, prompt engineering, SQL generation pipelines, validation systems, reasoning chains, backend integrations, and conversational follow-up handling.

The architecture involved multi-step reasoning workflows that translated user intent into database-aware SQL generation while maintaining awareness of schema relationships and business logic. He also worked on validation and query safety systems to reduce incorrect or unsafe SQL generation.

The project emphasized practical business intelligence workflows rather than generic chatbot interaction. Users could ask analytical questions conversationally, receive generated SQL queries, and continue asking follow-up questions within the same context.

Technologies involved included LangGraph, LangChain, Python, SQL systems, orchestration workflows, and backend integrations.

This work combined retrieval-aware prompting, workflow orchestration, backend engineering, and conversational AI system design.

---

# Financial Intelligence System — Problem

Financial systems often require technical analysts who understand schemas, SQL, and business logic.

This creates operational bottlenecks and limits accessibility of internal data systems.

The goal was to build conversational business intelligence workflows using natural language.

---

# Financial Intelligence System — What Assem Built

Worked on:

- schema grounding
- prompt engineering
- SQL generation workflows
- multi-step reasoning chains
- validation pipelines
- query safety checks
- conversational follow-up handling
- backend integrations
- orchestration workflows
- agent-based reasoning systems

Stack:

- LangGraph
- LangChain
- Python
- SQL

---

# Financial Intelligence System — Engineering Value

Improved:

- accessibility of data analysis
- conversational BI workflows
- operational efficiency
- query turnaround speed
- usability for non-technical users

---

# Enterprise Knowledge Assistants — Complete Summary

Built enterprise retrieval systems designed to improve internal knowledge access across healthcare, legal, and operational environments.

These systems focused on grounded retrieval rather than generic chatbot interaction. The goal was to help organizations retrieve policies, regulations, internal documentation, and operational knowledge through conversational AI interfaces.

Assem worked on ingestion systems, preprocessing pipelines, chunking strategies, embeddings, vector retrieval systems, backend APIs, deployment workflows, and grounding prompts.

The projects emphasized retrieval quality, contextual accuracy, and practical operational usefulness. Work included improving semantic retrieval, designing maintainable backend systems, and building scalable ingestion pipelines for enterprise document workflows.

Technologies involved included Python, vector databases, embeddings, LangChain, OpenAI APIs, Docker, AWS infrastructure, and retrieval pipelines.

---

# Enterprise Knowledge Assistants — Use Cases

Built retrieval systems for:

- hospital internal regulations
- legal knowledge retrieval
- enterprise policies
- operational documentation
- internal Q&A systems

---

# Enterprise Knowledge Assistants — Contributions

Worked on:

- ingestion design
- preprocessing systems
- chunking strategies
- embeddings
- vector storage
- semantic retrieval
- grounding workflows
- backend APIs
- deployment pipelines

Stack:

- Python
- vector databases
- embeddings
- LangChain
- OpenAI API
- Docker
- AWS

---

# Enterprise Knowledge Assistants — Outcome

Improved:

- internal knowledge access
- policy lookup speed
- operational efficiency
- organizational knowledge reuse
- retrieval accuracy

---

# Speech AI Systems — Voice Automation

Built applied voice systems involving:

- Speech-to-Text
- Text-to-Speech
- conversational voice interfaces
- workflow automation

Use cases included:

## Fast Food Ordering

- conversational ordering systems
- intent recognition
- workflow routing
- ordering automation

## Brokerage / Customer Service

- transcription systems
- spoken response generation
- workflow acceleration
- support augmentation

Technical themes:

- conversational AI
- speech pipelines
- workflow orchestration
- real-time interaction systems

---

# Document OCR / Extraction Support — Complete Summary

Worked on OCR-related tooling used in document processing and retrieval-support workflows.

The work focused on extracting structured or searchable text from documents in order to improve downstream retrieval systems, document understanding, preprocessing pipelines, and operational workflows.

Contributions included OCR extraction systems, preprocessing workflows, document cleaning pipelines, extraction quality experimentation, and text normalization workflows.

This work was separate from the computer-vision license plate recognition internship work and instead focused on document-oriented extraction and retrieval support.

Technologies involved included EasyOCR, PaddleOCR, Python, OpenCV, and preprocessing pipelines.

---

# Document OCR / Extraction Support — What Assem Built

Worked on:

- OCR extraction pipelines
- preprocessing systems
- text extraction workflows
- document cleaning pipelines
- extraction quality experimentation
- document understanding support workflows

Stack:

- EasyOCR
- PaddleOCR
- Python
- OpenCV

---

# Cross-Project Strengths

Recurring strengths visible across projects:

- practical systems thinking
- end-to-end ownership
- backend engineering depth
- retrieval engineering
- orchestration mindset
- production AI systems thinking
- product awareness
- iterative refinement
- deployment awareness
- evaluation-driven engineering
- scalable backend architecture
- fast execution in startup environments