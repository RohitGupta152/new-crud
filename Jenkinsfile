pipeline {
  agent any

  environment {
    IMAGE_NAME = "new-crud-api"
    CONTAINER_NAME = "new-crud-api"
  }

  stages {

    stage('Checkout from GitHub (main)') {
      steps {
        git branch: 'main',
            url: 'https://github.com/RohitGupta152/new-crud.git'
      }
    }

    stage('Build Docker Image') {
      steps {
        sh 'docker build -t $IMAGE_NAME .'
      }
    }

    stage('Deploy Container') {
      steps {
        sh '''
          docker rm -f $CONTAINER_NAME || true

          docker run -d \
            --name $CONTAINER_NAME \
            -p 3000:3000 \
            -e PORT=3000 \
            -e MONGODB_URI="$MONGODB_URI" \
            $IMAGE_NAME
        '''
      }
    }
  }

  post {
    success {
      echo "✅ Deployed from GitHub main branch successfully"
    }
    failure {
      echo "❌ Deployment failed"
    }
  }
}
