
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

        stage('Validate Configuration') {
            steps {
                sh '''
                    test -f docker-compose.yml
                    test -f docker-compose.prod.yml
                    test -f nginx/nginx.conf

                    for service in user product order; do
                        test -f services/${service}-service/Dockerfile
                        test -f services/${service}-service/app.py
                    done

                    docker compose -f docker-compose.yml config -q
                    docker compose -f docker-compose.prod.yml config -q
                '''
            }
        }

        stage('Application Tests') {
            steps {
                sh '''
                    for service in user product order; do
                        python3 -m py_compile \
                          services/${service}-service/app.py
                    done
                '''
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
                        services/frontend-service     
                '''
            }
        }

        stage('Tag Images') {
            steps {
                sh '''
                    for service in user product order; do
                        docker tag ${service}-service:${IMAGE_TAG} \
                        ${ECR_REGISTRY}/${service}-service:${IMAGE_TAG}
                    done
                '''
            }
        }

        stage('Push to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-access-key'
                ]]) {
                    sh '''
                        aws ecr get-login-password \
                        --region ${AWS_REGION} | \
                        docker login \
                        --username AWS \
                        --password-stdin ${ECR_REGISTRY}

                        for service in user product order; do
                            docker push \
                            ${ECR_REGISTRY}/${service}-service:${IMAGE_TAG}
                        done
                    '''
                }
            }
        }

        stage('Prepare Deployment') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=accept-new \
                            ubuntu@${EC2_HOST} \
                            "sudo mkdir -p ${DEPLOY_DIR} &&
                             sudo chown ubuntu:ubuntu ${DEPLOY_DIR}"

                        scp docker-compose.prod.yml \
                            ubuntu@${EC2_HOST}:${DEPLOY_DIR}/

                        scp -r nginx \
                            ubuntu@${EC2_HOST}:${DEPLOY_DIR}/
                    '''
                }
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

                            sudo -E docker compose \
                            -f docker-compose.prod.yml pull &&

                            sudo -E docker compose \
                            -f docker-compose.prod.yml up -d
                        "
                    '''
                }
            }
        }

        stage('Deployment Verification') {
            steps {
                sh '''
                    sleep 15

                    curl --fail --retry 5 --retry-delay 5 \
                    http://${EC2_HOST}/health/user

                    curl --fail \
                    http://${EC2_HOST}/health/product

                    curl --fail \
                    http://${EC2_HOST}/health/order
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
