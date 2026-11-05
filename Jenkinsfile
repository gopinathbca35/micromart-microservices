pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        AWS_REGION = 'ap-south-1'
        AWS_ACCOUNT_ID = '372951851936'
        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        EC2_HOST = '15.252.129.211'

        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'Git-cred',
                    url: 'https://github.com/gopinathbca35/micromart-microservices.git'
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    set -e

                    docker build -t user-service:${IMAGE_TAG} \
                        services/user-service

                    docker build -t product-service:${IMAGE_TAG} \
                        services/product-service

                    docker build -t order-service:${IMAGE_TAG} \
                        services/order-service

                    docker build -t frontend-service:${IMAGE_TAG} \
                        ./frontend
                '''
            }
        }

        stage('Tag Images') {
            steps {
                sh '''
                    set -e

                    for service in user product order frontend; do
                        docker tag ${service}-service:${IMAGE_TAG} \
                        ${ECR_REGISTRY}/${service}-service:${IMAGE_TAG}
                    done
                '''
            }
        }

        stage('Push to ECR') {
            steps {
                sh '''
                    set -e

                    aws sts get-caller-identity

                    aws ecr get-login-password \
                        --region ${AWS_REGION} |
                    docker login \
                        --username AWS \
                        --password-stdin ${ECR_REGISTRY}

                    for service in user product order frontend; do
                        docker push \
                        ${ECR_REGISTRY}/${service}-service:${IMAGE_TAG}
                    done
                '''
            }
        }

        
stage('Deploy to EC2') {
    steps {
        withCredentials([
            sshUserPrivateKey(
                credentialsId: 'ec2-ssh-key',
                keyFileVariable: 'SSH_KEY',
                usernameVariable: 'SSH_USER'
            )
        ]) {
            sh '''
                set -e

                ssh -i "$SSH_KEY" \
                    -o StrictHostKeyChecking=accept-new \
                    -o IdentitiesOnly=yes \
                    ${SSH_USER}@${EC2_HOST} "

                    set -e

                    cd micromart-microservices

                    export AWS_DEFAULT_REGION=${AWS_REGION}
                    export ECR_REGISTRY=${ECR_REGISTRY}
                    export IMAGE_TAG=${IMAGE_TAG}

                    echo 'Logging into ECR...'

                    aws ecr get-login-password \
                        --region ${AWS_REGION} |
                    sudo docker login \
                        --username AWS \
                        --password-stdin ${ECR_REGISTRY}

                    echo 'Pulling ECR images...'

                    sudo docker compose pull

                    echo 'Starting containers...'

                    sudo docker compose up -d

                    echo 'Checking deployment...'

                    sudo docker compose ps
                "
            '''
        }
    }
}
    }

    post {
        success {
            echo "Deployment successful. Image tag: ${IMAGE_TAG}"
        }

        failure {
            echo "Pipeline failed. Check Jenkins console output."
        }

        always {
            echo "CI/CD pipeline execution completed."
        }
    }
}
