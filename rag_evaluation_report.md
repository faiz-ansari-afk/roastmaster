# 🎯 RAG Retrieval Evaluation Report

**Evaluation Date:** `2026-10-09 07:29:07 UTC`  
**Target Session:** `roast_1791448298854_hlvkord`  
**Total Queries Evaluated:** **30**  

## 📊 Executive Summary Scorecard

| Core Retrieval Metric | Score | Industry Target | Status |
| :--- | :--- | :--- | :--- |
| **Recall@3** | **96.7%** | $\ge 85\%$ | 🟢 Excellent |
| **MRR (Mean Reciprocal Rank)** | **0.936** | $\ge 0.75$ | 🟢 High Precision |
| **Recall@1 (Top-1 Hit)** | **90.0%** | $\ge 65\%$ | 🟢 High Top-1 Accuracy |
| **Recall@5** | **100.0%** | $\ge 90\%$ | 🟢 Optimal Recall |
| **Precision@3 (In-Doc)** | **74.7%** | $\ge 50\%$ | 🟢 Clean Context |
| **Refusal / Negative Grounding** | **100.0%** | $100\%$ | 🟢 Safe (Zero False Citations) |
| **Average Retrieval Latency** | **616 ms** | $< 350\text{ ms}$ | 🟡 Moderate |

## 🔍 Breakdown by Query Archetype

| Query Archetype | Queries | Recall@3 | MRR | Hit Rate | Avg Latency |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Known Answer (Factual)** | 6 | **100.0%** | **0.889** | 100.0% | 757 ms |
| **2. Similar Question (Paraphrased)** | 5 | **100.0%** | **0.900** | 100.0% | 580 ms |
| **3. Ambiguous (Underspecified)** | 5 | **100.0%** | **1.000** | 100.0% | 583 ms |
| **4. Out-of-Document (Refusal)** | 5 | **100.0%** | **1.000** | 100.0% | 575 ms |
| **5. Exact Keyword (Codes/Models)** | 5 | **100.0%** | **1.000** | 100.0% | 580 ms |
| **6. Multi-Hop (Cross-Sectional)** | 4 | **75.0%** | **0.813** | 100.0% | 591 ms |

## 📋 Detailed Query Results

| ID | Archetype | Query | Expected Page | Top-3 Retrieved | Rank 1 | MRR | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `KA_01` | known_answer | "Does accidental damage protection cove..." | 9, 16 | 9, 16, 9 | #1 | 1.00 | ✅ PASS |
| `KA_02` | known_answer | "What percentage of the actual part cos..." | 10 | 10, 10, 7 | #1 | 1.00 | ✅ PASS |
| `KA_03` | known_answer | "What are the supported laptop manufact..." | 2, 15 | 2, 33, 1 | #1 | 1.00 | ✅ PASS |
| `KA_04` | known_answer | "What is the phone extension and email ..." | 42 | 42, 42, 3 | #1 | 1.00 | ✅ PASS |
| `KA_05` | known_answer | "What is the battery life specified for..." | 6 | 2, 7, 6 | #3 | 0.33 | ✅ PASS |
| `KA_06` | known_answer | "What are the tips to reduce paper wast..." | 30 | 3, 3, 30 | #1 | 1.00 | ✅ PASS |
| `SIM_01` | similar_paraphrase | "If I accidentally knock over my coffee..." | 9, 16 | 15, 9, 8 | #1 | 1.00 | ✅ PASS |
| `SIM_02` | similar_paraphrase | "How much cash do students have to pay ..." | 10 | 10, 23 | #1 | 1.00 | ✅ PASS |
| `SIM_03` | similar_paraphrase | "Can I bring an Apple MacBook to school..." | 16 | 14, 16, 11 | #1 | 1.00 | ✅ PASS |
| `SIM_04` | similar_paraphrase | "Who should I call if my laptop crashes..." | 42 | 38, 10, 23 | #2 | 0.50 | ✅ PASS |
| `SIM_05` | similar_paraphrase | "What happens if fixing my computer tak..." | 8 | 8, 13 | #1 | 1.00 | ✅ PASS |
| `AMB_01` | ambiguous | "laptop damage fee" | 9, 10 | 9, 10, 9 | #1 | 1.00 | ✅ PASS |
| `AMB_02` | ambiguous | "printing tips" | 30 | 3, 30, 29 | #1 | 1.00 | ✅ PASS |
| `AMB_03` | ambiguous | "loaner laptop" | 6, 8 | 2, 7, 2 | #1 | 1.00 | ✅ PASS |
| `AMB_04` | ambiguous | "helpdesk hours" | 42 | 42, 43, 42 | #1 | 1.00 | ✅ PASS |
| `AMB_05` | ambiguous | "warranty protection" | 9, 15, 16 | 9, 15, 16 | #1 | 1.00 | ✅ PASS |
| `OOD_01` | out_of_document | "What is the cafeteria lunch menu for F..." | *None (OOD)* | *None* | #1 | 1.00 | ✅ PASS |
| `OOD_02` | out_of_document | "How do alumni apply for campus dormito..." | *None (OOD)* | *None* | #1 | 1.00 | ✅ PASS |
| `OOD_03` | out_of_document | "What is the luggage weight limit for i..." | *None (OOD)* | *None* | #1 | 1.00 | ✅ PASS |
| `OOD_04` | out_of_document | "How to configure Docker container netw..." | *None (OOD)* | *None* | #1 | 1.00 | ✅ PASS |
| `OOD_05` | out_of_document | "What is the refund return policy for v..." | *None (OOD)* | *None* | #1 | 1.00 | ✅ PASS |
| `KW_01` | exact_keyword | "Lenovo Yoga 12 Thinkpad" | 48 | 3, 48, 3 | #1 | 1.00 | ✅ PASS |
| `KW_02` | exact_keyword | "AppleCare" | 16 | 16 | #1 | 1.00 | ✅ PASS |
| `KW_03` | exact_keyword | "WinRar Archiver Utility" | 12 | 17, 17 | #1 | 1.00 | ✅ PASS |
| `KW_04` | exact_keyword | "helpdesk@kingsacademy.edu.jo" | 42 | 42, 42, 43 | #1 | 1.00 | ✅ PASS |
| `KW_05` | exact_keyword | "Dell Latitude 6430" | 6 | 3, 47, 10 | #1 | 1.00 | ✅ PASS |
| `MH_01` | multi_hop | "If my laptop requires extensive repair..." | 8, 10 | 10, 7, 2 | #1 | 1.00 | ✅ PASS |
| `MH_02` | multi_hop | "What warranty coverage is recommended ..." | 9, 16 | 9, 15, 16 | #1 | 1.00 | ✅ PASS |
| `MH_03` | multi_hop | "How should students take care of their..." | 26, 27 | 3, 23, 28 | #1 | 1.00 | ✅ PASS |
| `MH_04` | multi_hop | "If a student loses their laptop charge..." | 10, 42 | 7, 25, 2 | #4 | 0.25 | ✅ PASS |
