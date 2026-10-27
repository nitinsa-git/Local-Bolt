---
name: aws-cloud-architect
category: AWS Cloud & Architecture
description: Comprehensive AWS Cloud Architecture, Serverless (Lambda, API Gateway, DynamoDB, EventBridge), Containers (ECS Fargate, EKS), AWS CDK v2 / Terraform IaC, Amazon Bedrock GenAI, IAM Least-Privilege Security, and FinOps Cost Telemetry skill. Use when designing, building, deploying, or visualizing AWS cloud architectures, infrastructure-as-code, or AWS management consoles.
---

# AWS Cloud Architect & Serverless Engineering Skill (`aws-cloud-architect`)

## 1. Overview & Core Capabilities
Use this skill whenever the user asks to design, build, generate code for, or visualize **Amazon Web Services (AWS)** architectures, serverless backends, container platforms, cloud telemetry dashboards, or Infrastructure-as-Code (IaC).

| Domain Pillar | Key AWS Services Covered | Deliverable / Code Patterns |
| :--- | :--- | :--- |
| **1. Serverless & Event-Driven** | AWS Lambda, Amazon API Gateway (REST/HTTP/WebSocket), Amazon DynamoDB (Single-Table Design), Amazon EventBridge, AWS Step Functions, Amazon SQS/SNS | Handler functions, DynamoDB PK/SK access patterns, Step Functions ASL state machines, dead-letter queue (DLQ) resilience. |
| **2. Containers & Compute** | Amazon ECS (Fargate), Amazon EKS, AWS App Runner, Application Load Balancer (ALB), Auto Scaling Groups, EC2 | Multi-AZ task definitions, health check probes, target group routing, horizontal pod/task autoscaling policies. |
| **3. Storage, CDN & Databases** | Amazon S3, Amazon CloudFront (OAC), Amazon Aurora Serverless v2 (PostgreSQL/MySQL), Amazon ElastiCache (Redis/Valkey), Amazon OpenSearch | Presigned URL upload pipelines, CloudFront edge caching, RDS Proxy connection pooling, multi-region replication. |
| **4. Infrastructure as Code (IaC)** | AWS CDK v2 (TypeScript / Python), Terraform (`hashicorp/aws`), AWS SAM, AWS CloudFormation | L2/L3 CDK constructs, modular Terraform `main.tf` / `variables.tf` / `outputs.tf`, parameterized stacks. |
| **5. Security, IAM & Compliance** | AWS IAM, AWS KMS, AWS Secrets Manager, AWS WAF, Amazon Cognito, AWS Organizations, Security Hub | Least-privilege IAM JSON policy documents, OIDC federated roles, KMS envelope encryption, Cognito JWT authorizers. |
| **6. GenAI & Data Analytics** | Amazon Bedrock (Agents, Knowledge Bases, Guardrails), Amazon SageMaker, AWS Glue, Amazon Athena, Amazon Kinesis | Bedrock Converse API / Agent workflows, RAG vector indexing with OpenSearch Serverless, streaming ETL pipelines. |
| **7. Observability & FinOps** | Amazon CloudWatch (Metrics, Logs Insights, Alarms), AWS X-Ray, AWS Cost Explorer, AWS Budgets | RED telemetry dashboards, P95/P99 latency alarms, service cost breakdowns, Right-Sizing & Savings Plan estimators. |

---

## 2. AWS Well-Architected Implementation Rules
1. **Security Pillar (Least Privilege & Zero Hardcoded Credentials)**:
   - Never hardcode `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY`. Always use IAM Roles (Execution Roles, IRSA / Pod Identity, or GitHub Actions OIDC).
   - Scope IAM policy `Action` and `Resource` ARNs to the minimum required permissions; enforce `aws:SecureTransport` and KMS encryption at rest (`s3:x-amz-server-side-encryption`, DynamoDB KMS, EBS encryption).
2. **Reliability & High Availability Pillar**:
   - Deploy stateful and compute workloads across **3 Availability Zones (Multi-AZ)** with private subnets for compute/data and public subnets restricted to ALB/NAT Gateways.
   - Configure idempotent retries with exponential backoff + jitter, SQS Dead-Letter Queues (`maxReceiveCount: 3`), and Circuit Breakers.
3. **Performance Efficiency & Cost Optimization (FinOps)**:
   - Prefer AWS Graviton4 (`arm64`) for Lambda, ECS Fargate, RDS, and ElastiCache for up to 40% better price-performance.
   - Use S3 Intelligent-Tiering / Lifecycle rules, DynamoDB On-Demand or Auto-Scaled Provisioned capacity, and CloudFront edge caching to minimize data transfer egress.
4. **Interactive AWS Console & Architecture Visualization (For Web / Studio Apps)**:
   - When synthesizing an AWS dashboard, architecture designer, or FinOps portal in Local Bolt (`VibeForge`), include:
     - **Region Selector** (`us-east-1`, `us-west-2`, `eu-central-1`, `ap-south-1`) that dynamically filters resources and telemetry.
     - **Interactive Service Topology / Resource Inventory Table** with live health status badges (`HEALTHY`, `SCALING`, `THROTTLED`), ARN copy buttons, and latency/cost metrics.
     - **Copy-Ready IaC Code Inspector Tabs** providing synchronized **AWS CDK (TypeScript)**, **Terraform (`main.tf`)**, and **IAM Policy (`policy.json`)** snippets for the selected AWS service or architecture.
