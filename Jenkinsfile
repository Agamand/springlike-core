pipeline {
    agent any
    stages {
        
        stage('Package') {
            agent {
                docker {
                    image 'node:7-alpine'
                    reuseNode true
                }
            }
            steps {
                sh 'npm pack'
            }
        }
        stage('Deploy') {
            when{ branch 'master'} 
            agent {
                docker {
                    image 'node:7-alpine'
                    reuseNode true
                }
            }
            steps {
                sh 'echo NIP'
            }
        }
      
    }
    post {
        always {
            archiveArtifacts artifacts:'*.tgz'
        }
    }
}