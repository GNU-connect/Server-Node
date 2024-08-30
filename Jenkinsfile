pipeline {
    agent any

    environment {
        DOCKER_IMAGE_NAME = 'connect-gnu-node'
        DOCKER_TAG = 'latest'
        DOCKER_REGISTRY = 'dongho18'
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {
        stage('Checkout') {
            steps {
                // Git 저장소에서 코드 체크아웃
                checkout scm
            }
        }

        stage('Build') {
            steps {
                script {
                    // Docker 이미지 빌드
                    sh 'docker build -t ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} .'
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    // Docker 컨테이너에서 테스트 실행
                    // sh 'docker run --rm ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} pnpm test'
                }
            }
        }

        stage('Push') {
            steps {
                script {
                    // Docker 이미지 푸시
                    sh 'docker tag ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}'
                    sh 'docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}'
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Docker Compose를 사용하여 애플리케이션 배포
                    sh 'docker-compose -f ${DOCKER_COMPOSE_FILE} down'
                    sh 'docker-compose -f ${DOCKER_COMPOSE_FILE} up -d'
                }
            }
        }
    }

    post {
        always {
            // 빌드 후 항상 실행되는 단계 (예: 클린업)
            sh 'docker system prune -af'
        }
        success {
            // 성공적인 빌드 후 실행되는 단계
            echo 'Build and deployment succeeded!'
        }
        failure {
            // 빌드 실패 후 실행되는 단계
            echo 'Build or deployment failed!'
        }
    }
}
