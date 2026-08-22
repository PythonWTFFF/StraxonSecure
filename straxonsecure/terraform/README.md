# Straxon Secure — Cloud Infrastructure (AWS)

This directory contains the authoritative Terraform configurations used to provision the production cloud environment for the Straxon Secure platform.

## Architecture Overview
The `main.tf` script leverages the official AWS Terraform modules to automatically scaffold:
- **Virtual Private Cloud (VPC)**: A highly available network spanning 3 Availability Zones with dedicated public and private subnets.
- **Amazon EKS Cluster**: The managed Kubernetes control plane (`straxon-prod-cluster`).
- **Managed Node Groups**: EC2 instances (`t3.medium` by default) deployed into the private subnets to run your frontend, ML Engine, and Redis pods securely.

## Deployment Instructions

### Prerequisites
1. Ensure you have the [Terraform CLI](https://developer.hashicorp.com/terraform/downloads) installed.
2. Ensure you have the [AWS CLI](https://aws.amazon.com/cli/) installed and configured with valid administrator credentials (`aws configure`).

### Step 1: Initialize Terraform
Initialize the working directory containing the configuration files and download the required AWS provider plugins:
```bash
terraform init
```

### Step 2: Plan the Deployment
Generate and review the execution plan. This allows you to verify exactly what resources AWS will spin up before committing to it.
```bash
terraform plan
```
*(Optional)*: To deploy to a different region or change the instance type, pass in variable flags:
```bash
terraform plan -var="aws_region=eu-west-1" -var="node_instance_type=t3.large"
```

### Step 3: Apply the Infrastructure
Apply the configuration to definitively create the VPC and EKS cluster. This process takes approximately 15-20 minutes as the EKS control plane initializes.
```bash
terraform apply
```

### Step 4: Connect Kubectl
Once the deployment finishes, configure your local `kubectl` context to connect to your brand new cluster:
```bash
aws eks update-kubeconfig --region us-east-1 --name straxon-prod-cluster
```

### Step 5: Deploy the Application Manifests
Navigate to the `../k8s` directory and apply the Kubernetes configurations to launch the Straxon Secure platform onto your new AWS infrastructure!
```bash
cd ../k8s
kubectl apply -f secrets.yaml
kubectl apply -f configmap.yaml
kubectl apply -f redis-deployment.yaml
kubectl apply -f ml-engine-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ingress.yaml
```

### Teardown
If you ever need to destroy the environment to save costs:
```bash
terraform destroy
```
