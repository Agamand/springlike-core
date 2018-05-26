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
              setNewVersion()
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
              npm publish
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

def setNewVersion(){
    def version= sh(returnStdout: true, script: 'node -p "require(\'./package.json\').version"').trim();
    echo "${version}.${env.BUILD_ID}"
    sh "npm version ${version}-${env.BUILD_ID}"
}