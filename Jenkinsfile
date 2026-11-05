
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
        DEPLOY_DIR = '/opt/microservices-app'

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
                   aws sts get-caller-identity

            aws ecr get-login-password --region ap-south-1 |
            docker login --username AWS --password-stdin \
            372951851936.dkr.ecr.ap-south-1.amazonaws.com

            docker push 372951851936.dkr.ecr.ap-south-1.amazonaws.com/user-service:${IMAGE_TAG}
            docker push 372951851936.dkr.ecr.ap-south-1.amazonaws.com/product-service:${IMAGE_TAG}
            docker push 372951851936.dkr.ecr.ap-south-1.amazonaws.com/order-service:${IMAGE_TAG}
            docker push 372951851936.dkr.ecr.ap-south-1.amazonaws.com/frontend-service:${IMAGE_TAG}
        '''
    }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh '''
                        ssh ubuntu@${EC2_HOST} "
                            cd ${DEPLOY_DIR} &&
                            export AWS_DEFAULT_REGION=${AWS_REGION} &&
                            export ECR_REGISTRY=${ECR_REGISTRY} &&
                            export IMAGE_TAG=${IMAGE_TAG} &&

                            aws ecr get-login-password \
                            --region ${AWS_REGION} |
                            sudo docker login \
                            --username AWS \
                            --password-stdin ${ECR_REGISTRY} &&

                            sudo docker compose up -d \
                              "
                    '''
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
