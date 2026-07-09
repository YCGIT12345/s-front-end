#!/bin/bash
# ==========================================
# Jenkins 服务器端初始化脚本
# 在 47.102.202.180 上执行: bash setup-jenkins.sh
# ==========================================

set -e

DEPLOY_DIR="/tsingli/admin"
JENKINS_COMPOSE="docker-compose.jenkins.yml"

echo "========================================"
echo "  Jenkins 服务器初始化"
echo "========================================"

# 1. 创建部署目录
echo "[1/5] 创建部署目录..."
mkdir -p ${DEPLOY_DIR}

# 2. 检查 Docker 是否安装
echo "[2/5] 检查 Docker 环境..."
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装，请先安装 Docker"
    echo "CentOS: yum install -y docker"
    echo "Ubuntu: apt install -y docker.io"
    exit 1
fi
docker --version
echo "Docker 已就绪"

# 3. 检查 docker-compose 或 docker compose
echo "[3/5] 检查 Docker Compose..."
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "错误: 未找到 docker compose，请安装"
    exit 1
fi
echo "Docker Compose 已就绪: ${COMPOSE_CMD}"

# 4. 构建并启动 Jenkins
echo "[4/5] 构建 Jenkins 镜像并启动容器..."
cd ${DEPLOY_DIR}
${COMPOSE_CMD} -f ${JENKINS_COMPOSE} down 2>/dev/null || true
${COMPOSE_CMD} -f ${JENKINS_COMPOSE} build --no-cache
${COMPOSE_CMD} -f ${JENKINS_COMPOSE} up -d

# 5. 等待 Jenkins 启动
echo "[5/5] 等待 Jenkins 启动..."
sleep 5

# 检查容器状态
if docker ps --filter name=jenkins --format '{{.Status}}' | grep -q "Up"; then
    echo ""
    echo "========================================"
    echo "  ✅ Jenkins 启动成功！"
    echo "========================================"
    echo ""
    echo "  访问地址: http://47.102.202.180:8090"
    echo ""
    echo "  初始密码:"
    # 等待 Jenkins 生成初始密码
    for i in {1..30}; do
        PASS=$(docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null) && break
        sleep 2
    done
    if [ -n "$PASS" ]; then
        echo "  ${PASS}"
    else
        echo "  (请手动获取: docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword)"
    fi
    echo ""
    echo "  后续步骤:"
    echo "  1. 浏览器打开上述地址，输入初始密码"
    echo "  2. 选择 '安装推荐的插件'"
    echo "  3. 创建管理员账号"
    echo "  4. 配置凭据: Manage Jenkins → Credentials"
    echo "     添加 ID=tsingli-server-credentials 的账号密码凭据"
    echo "  5. 创建 Pipeline Job，指向仓库 Jenkinsfile"
    echo "========================================"
else
    echo "❌ Jenkins 启动失败，请检查日志:"
    docker logs jenkins --tail 20
    exit 1
fi