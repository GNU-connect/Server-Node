pipeline {
    agent any

    environment {
        DOCKER_IMAGE_NAME = 'connect-gnu-node'
        DOCKER_TAG = 'latest'
        DOCKER_REGISTRY = 'dongho18'
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
        DOCKERHUB_CREDENTIALS = credentials('docker-hub-flask')
    }

    stages {
        stage('Checkout') {
            steps {
                // Git 저장소에서 코드 체크아웃
                git branch: 'main', url: 'https://github.com/GNU-connect/Server-Node'
            }
        }

        stage('Post Slack') {
            steps{
                slackSend(channel: '#build-notification', color: 'warning', message: "빌드 시작: 지누가 ${env.JOB_NAME} 서버 ${env.BUILD_NUMBER} 버전을 열심히 빌드중이야!")
            }
        }

        stage('Set ENV') {
            steps {
                withCredentials([file(credentialsId: 'Node-ENV', variable: 'configFile')]) {
                    script {
                        sh 'chmod -R rwx .'
                        sh 'cp ${configFile} .env'
                        sh 'chmod 644 .env'
                        sh 'cat .env'
                    }
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    // Docker 이미지 빌드
                    sh 'docker-compose build backend_node_server'
                }
            }
        }

        stage('Push') {
            steps {
                script {
                    // Docker 이미지 푸시
                    sh 'docker tag ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME} ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}'
                    sh 'docker login -u ${DOCKERHUB_CREDENTIALS_USR} -p ${DOCKERHUB_CREDENTIALS_PSW}'
                    sh 'docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}'
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Docker Compose를 사용하여 애플리케이션 배포
                    sh 'docker-compose down'
                    sh 'docker-compose up -d backend_node_server'
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
            slackSend(channel: '#build-notification', color: 'good', message: "빌드 성공: 야호! ${env.JOB_NAME} 서버 ${env.BUILD_NUMBER} 버전이 성공적으로 배포되었어!")
        }
        failure {
            // 빌드 실패 후 실행되는 단계
            slackSend(channel: '#build-notification', color: 'danger', message: "빌드 실패: 이런... ${env.JOB_NAME} 서버 ${env.BUILD_NUMBER} 버전 빌드에 실패했어 ㅜㅜ\n사유: ${currentBuild.result}")
        }
    }
}
