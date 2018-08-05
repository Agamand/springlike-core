pipeline {
    agent any
    options {
      buildDiscarder(logRotator(numToKeepStr: '6', artifactNumToKeepStr: '6'))
    }
    stages {      
      stage('prepare'){
        agent {
            docker {
                image 'node:10.1-alpine'
                reuseNode true
            }
          }
        steps{
          script{
            if (env.BRANCH_NAME == 'master') {
              npm.setAsRelease();
            } else {
              npm.setAsSnapshot();
            }
          }
        }
      }
      stage('build') {
          agent {
            docker {
                image 'node:10.1-alpine'
                reuseNode true
            }
          }
          steps {
              sh 'npm install && npm run build'
          }
      }
      stage('Package') {
          agent {
            docker {
                image 'node:10.1-alpine'
                reuseNode true
            }
          }
          steps {
              sh 'npm pack'
          }
      }
      stage('Deploy') {
          when{
            anyOf{
              branch 'master'
              branch 'develop'
            } 
          }
          agent {
            docker {
                image 'node:10.1-alpine'
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
          publishHTML([allowMissing: false, alwaysLinkToLastBuild: false, keepAll: false, reportDir: 'docs', reportFiles: 'index.html', reportName: 'Docs', reportTitles: ''])
      }
    }
}