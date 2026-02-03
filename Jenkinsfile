pipeline {
  agent any

  environment {
    IMAGE_NAME = "new-crud-api"
    CONTAINER_NAME = "new-crud-api"
    PORT = "3000"
  }

  stages {

    stage('Checkout from GitHub') {
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
          docker stop $CONTAINER_NAME || true
          docker rm $CONTAINER_NAME || true

          docker run -d \
            --name $CONTAINER_NAME \
            -p 3001:3000 \
            -e PORT=3000 \
            -e MONGODB_URI="mongodb+srv://rohit703077:VYQUlU0TncWaXqFT@cluster0.e7rgt.mongodb.net/CRUD?retryWrites=true&w=majority" \
            $IMAGE_NAME
        '''
      }
    }
  }

  post {
    success {
      echo "✅ Deployment successful"
    }
    failure {
      echo "❌ Deployment failed"
    }
  }
}