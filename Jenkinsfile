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
              script{
                npm.build();
              }
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
              script{
                npm.pack();
              }
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
            script{
              npm.publish();
            }
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