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
      stage('Tests') {
          agent {
            docker {
                image 'node:10.1-alpine'
                reuseNode true
            }
          }
          steps {
              script{
                npm.test();
                npm.coverage();
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
          junit allowEmptyResults: true, testResults: 'test-results.xml'
          cobertura autoUpdateHealth: false, autoUpdateStability: false, coberturaReportFile: 'coverage/*.xml', conditionalCoverageTargets: '70, 0, 0', failUnhealthy: false, failUnstable: false, lineCoverageTargets: '80, 0, 0', maxNumberOfBuilds: 0, methodCoverageTargets: '80, 0, 0', onlyStable: false, sourceEncoding: 'ASCII', zoomCoverageChart: false
      }
    }
}