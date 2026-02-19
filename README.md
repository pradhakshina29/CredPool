# CredPool – AI-Powered MSME Pooled Lending Platform

## 🚀 Overview
CredPool is a web platform that enables MSMEs to access loans through pooled micro‑lending.  
Multiple MSMEs can act as lenders to collectively fund a borrower.  
An AI engine evaluates cashflow, revenue stability, and repayment history to recommend loan amount, tenure, and risk.

## 🎯 Problem Statement
MSMEs struggle to access formal credit due to:
- Limited credit history  
- High risk for single lenders  
- Lack of transparent lending mechanisms  

CredPool solves this using pooled lending and AI-based credit scoring.

## 💡 Features
- 🔐 Phone OTP Authentication (Firebase Auth)
- 👥 Borrower & Lender roles
- 📝 Loan requests by borrowers
- 🤝 Pooling by multiple lenders
- 🤖 AI-based merit/credit score & loan eligibility
- 📊 Cashflow & credit score graphs
- 💳 Dummy payment gateway for demo
- 🗄️ Firebase Firestore backend

  ## ⚠️ Risk, Bankruptcy & False Claims Handling
- ❌ No self-declared bankruptcy: users cannot mark themselves bankrupt.
- ✅ Status changes only based on missed EMIs, cashflow trends, and repayment behavior.
- 🧠 AI early-warning system flags “At Risk” accounts before default.
- 🔁 Restructuring options for genuine distress (longer tenure / short moratorium).
- 📉 False claims or repeated defaults reduce merit score and freeze new loans.
- 🤝 Pooled-risk protection spreads loss across lenders.
- 🧾 Full audit logs for disputes and transparency.

## ⛓️ Blockchain (Future Improvements – Phase 2)
Planned (not in MVP) to add trust and auditability:
- 📜 Tamper-proof loan agreements (store loan terms hash on-chain)
- 🤝 Transparent pooling records (verify who funded what)
- 💸 Repayment proofs (on-chain hashes for disputes)
- 🧳 Portable credit history (hashes for cross-platform trust)
- 🤖 Smart contracts (auto-release funds, auto-distribute repayments)


## 🎥 Demo Video
https://youtu.be/Rsr51WX5uyo?si=B6Z6JDmToz2Gidpq
