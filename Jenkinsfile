pipeline {
    agent any
    options {
      buildDiscarder(logRotator(numToKeepStr: '6', artifactNumToKeepStr: '6'))
    }
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
            sh '''
              echo //npm.agamand.com/:_password="$NPM_PASSWORD" >> ~/.npmrc
              echo //npm.agamand.com/:username=$NPM_USERNAME >> ~/.npmrc
              echo //npm.agamand.com/:email=$NPM_EMAIL >> ~/.npmrc
              echo //npm.agamand.com/:always-auth=true >> ~/.npmrc
              npm publish -f
            '''
          }
      }
    }
    post {
      always {
          archiveArtifacts artifacts:'*.tgz'
      }
    }
}
