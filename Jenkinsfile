pipeline {
    agent any

    // ===================== 参数配置 =====================
    parameters {
        // 构建分支/标签，默认 main
        string(name: 'BRANCH', defaultValue: 'main', description: '构建的分支或标签')
        // 是否跳过测试，默认跳过加快构建
        booleanParam(name: 'SKIP_TESTS', defaultValue: true, description: '是否跳过单元测试')
        // 部署后是否清理旧的 Docker 镜像
        booleanParam(name: 'CLEAN_OLD_IMAGES', defaultValue: true, description: '清理服务器上旧的 Docker 镜像')
    }

    // ===================== 环境变量 =====================
    environment {
        // 目标服务器
        SERVER_IP   = '47.102.202.180'
        SERVER_USER = 'root'
        SERVER_PORT = '22'

        // 部署路径
        DEPLOY_DIR  = '/tsingli/admin'

        // Docker 镜像名
        IMAGE_NAME  = 'tsingli-admin'
        IMAGE_TAG   = "${env.BUILD_NUMBER}"
        // 部署压缩包名
        ARCHIVE_NAME = "${IMAGE_NAME}-${env.BUILD_NUMBER}.tar.gz"

        // Node 环境
        NODE_OPTIONS = '--max-old-space-size=8192'
    }

    // ===================== 阶段 =====================
    stages {

        // ---------- Stage 1: 代码检出 ----------
        stage('检出代码') {
            steps {
                script {
                    echo ">>> 正在检出分支: ${params.BRANCH}"
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: "*/${params.BRANCH}"]],
                        userRemoteConfigs: [[
                            url: scm.userRemoteConfigs[0].url,
                            credentialsId: scm.userRemoteConfigs[0].credentialsId
                        ]]
                    ])
                }
            }
        }

        // ---------- Stage 2: 环境准备 ----------
        stage('环境准备') {
            steps {
                script {
                    echo ">>> Node 版本:"
                    sh 'node --version'
                    echo ">>> pnpm 版本:"
                    sh 'pnpm --version'
                }
            }
        }

        // ---------- Stage 3: 安装依赖 ----------
        stage('安装依赖') {
            steps {
                echo '>>> 正在安装项目依赖...'
                sh 'pnpm install --frozen-lockfile'
            }
        }

        // ---------- Stage 4: 单元测试（可选） ----------
        stage('单元测试') {
            when {
                expression { !params.SKIP_TESTS }
            }
            steps {
                echo '>>> 正在运行单元测试...'
                sh 'pnpm test:unit'
            }
        }

        // ---------- Stage 5: 构建 web-antd ----------
        stage('构建 web-antd') {
            steps {
                echo '>>> 正在构建 web-antd 生产包...'
                sh 'pnpm run build:antd'
            }
            post {
                success {
                    echo ">>> 构建成功，产物位于 apps/web-antd/dist/"
                }
                failure {
                    error '构建失败，请检查构建日志'
                }
            }
        }

        // ---------- Stage 6: 构建 Docker 镜像 ----------
        stage('构建 Docker 镜像') {
            steps {
                script {
                    echo ">>> 正在构建 Docker 镜像: ${IMAGE_NAME}:${IMAGE_TAG}"
                    dir('apps/web-antd') {
                        // 将 Dockerfile 和 nginx 配置复制到 dist 目录同级
                        sh '''
                            cp ../../scripts/deploy/Dockerfile.antd ./Dockerfile
                            cp ../../scripts/deploy/nginx-antd.conf ./nginx-antd.conf
                        '''
                        // 构建镜像
                        sh """
                            docker build -f Dockerfile -t ${IMAGE_NAME}:${IMAGE_TAG} .
                        """
                        // 打 latest 标签
                        sh """
                            docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest
                        """
                        // 清理临时文件
                        sh 'rm -f Dockerfile nginx-antd.conf'
                    }
                }
            }
        }

        // ---------- Stage 7: 导出镜像 ----------
        stage('导出镜像') {
            steps {
                script {
                    echo ">>> 正在导出镜像为压缩包: ${ARCHIVE_NAME}"
                    sh """
                        docker save ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest | gzip > ${ARCHIVE_NAME}
                    """
                    echo ">>> 压缩包大小:"
                    sh "ls -lh ${ARCHIVE_NAME}"
                }
            }
        }

        // ---------- Stage 8: 部署到服务器 ----------
        stage('部署到服务器') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'tsingli-server-credentials',
                        usernameVariable: 'SSH_USER',
                        passwordVariable: 'SSH_PASS'
                    )]) {
                        def sshOpts = "-o StrictHostKeyChecking=no -p ${SERVER_PORT}"

                        echo ">>> 上传镜像压缩包到服务器..."
                        sh """
                            sshpass -p '${SSH_PASS}' scp ${sshOpts} ${ARCHIVE_NAME} ${SSH_USER}@${SERVER_IP}:${DEPLOY_DIR}/
                        """

                        echo ">>> 在服务器上执行部署..."
                        sh """
                            sshpass -p '${SSH_PASS}' ssh ${sshOpts} ${SSH_USER}@${SERVER_IP} << 'ENDSSH'
                                set -e
                                cd ${DEPLOY_DIR}

                                echo "[1/5] 加载 Docker 镜像..."
                                docker load < ${ARCHIVE_NAME}

                                echo "[2/5] 停止旧容器..."
                                docker stop ${IMAGE_NAME} || true
                                docker rm ${IMAGE_NAME} || true

                                echo "[3/5] 启动新容器..."
                                docker run -d \\
                                    --name ${IMAGE_NAME} \\
                                    --restart=always \\
                                    -p 8080:8080 \\
                                    ${IMAGE_NAME}:latest

                                echo "[4/5] 清理传输文件..."
                                rm -f ${ARCHIVE_NAME}

                                echo "[5/5] 验证容器状态..."
                                docker ps --filter name=${IMAGE_NAME} --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'

                                echo ">>> 部署完成！"
ENDSSH
                        """
                    }
                }
            }
        }

        // ---------- Stage 9: 清理过期镜像 ----------
        stage('清理服务器旧镜像') {
            when {
                expression { params.CLEAN_OLD_IMAGES }
            }
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'tsingli-server-credentials',
                        usernameVariable: 'SSH_USER',
                        passwordVariable: 'SSH_PASS'
                    )]) {
                        def sshOpts = "-o StrictHostKeyChecking=no -p ${SERVER_PORT}"
                        sh """
                            sshpass -p '${SSH_PASS}' ssh ${sshOpts} ${SSH_USER}@${SERVER_IP} << 'ENDSSH'
                                echo ">>> 清理无用的 Docker 镜像 (dangling)..."
                                docker image prune -f
                                echo ">>> 当前镜像列表:"
                                docker images ${IMAGE_NAME}
ENDSSH
                        """
                    }
                }
            }
        }
    }

    // ===================== 后置处理 =====================
    post {
        always {
            script {
                // 清理 Jenkins 上的临时压缩包
                echo ">>> 清理本地临时文件..."
                sh "rm -f ${ARCHIVE_NAME}"
            }
            // 无论成功失败，清理工作区
            cleanWs(
                cleanWhenNotBuilt: false,
                deleteDirs: true,
                disableDeferredWipeout: true
            )
        }
        success {
            echo "=============================="
            echo "  ✅ 部署成功！"
            echo "  镜像: ${IMAGE_NAME}:${IMAGE_TAG}"
            echo "  应用: http://${SERVER_IP}:8080/tsingli/admin"
            echo "=============================="
        }
        failure {
            echo "=============================="
            echo "  ❌ 部署失败，请检查日志"
            echo "=============================="
        }
    }
}