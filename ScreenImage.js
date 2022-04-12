import * as THREE from 'three'

export class ScreenImage {
  constructor(images, id) {
    this.images = images;
    this.cameraZ = 0;
    this.startZ = -3;
    this.spaceZ = 1.2;
    this.minZ = 0;
    this.speedZ = 0.02;
    this.cardWidth = 1;
    this.container = document.getElementById(id);
    const { width, height } = this.container.getBoundingClientRect();
    this.width = width;
    this.height = height;
    this.step();
  }

  async step() {
    // 场景
    const scene = new THREE.Scene();

    // 相机
    const camera = new THREE.PerspectiveCamera(45, this.width / this.height, 1, 1000);
    camera.position.set(0, 0, this.cameraZ);

    // 事件
    this.imageMouseEvent(camera, scene);

    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(this.width, this.height);
    this.container.appendChild(renderer.domElement);

    // 图片
    let imageArr = await this.createImages(scene);

    // 环境光
    const light = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(light);

    // 动画
    this.update({ imageArr, renderer, scene, camera });
  }

  // 行为
  imageMouseEvent(camera, scene) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let cuurrentObj = null;

    const mouseEvent = (e) => {
      // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      // 计算物体和射线的焦点
      const intersects = raycaster.intersectObjects(scene.children, true);

      // 清除上一个选中对象
      cuurrentObj
        ? cuurrentObj.object.scale.set(1, 1, 1)
        : (cuurrentObj = null);

      if (intersects.length) {
        // 处理选中的最上层对象
        if (intersects[0].object.isMesh) {
          cuurrentObj = intersects[0];
          // cuurrentObj.object.scale.set(1.05, 1.05, 1);
        }

        // 如果有点击
        if (e.buttons) {
          const link = cuurrentObj.object.link;
          link && window.open(link);
        }
      }
    };

    ['mousedown', 'mousemove'].forEach(eventName => {
      this.container.addEventListener(eventName, event => {
        mouseEvent(event);
      });
    });
  }

  // 创建图片集合
  async createImages(scene) {
    let imageArr = [];
    let matrix = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
    for (let i = 0; i < this.images.length; i++) {
      const mesh = await this.createMesh(this.images[i]);

      mesh.scale.set(1, 1, 1);

      const z = this.startZ - i * this.spaceZ;
      if (z < this.minZ)
        this.minZ = z;

      const pos = matrix[i % matrix.length];
      mesh.position.set(pos[0], pos[1], z);

      imageArr.push({
        obj: mesh,
        startZ: z
      });
      scene.add(mesh);
    }
    return imageArr;
  }

  // 创建矩形
  async createMesh(image) {
    const texture = await this._loadTexture(image);
    const material = new THREE.MeshLambertMaterial({
      map: texture,
    });
    const { width, height } = texture.image;
    const cardHeight = this.cardWidth * height / width;
    const geometry = new THREE.PlaneGeometry(this.cardWidth, cardHeight);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.link = 'https://www.bilibili.com/';
    return Promise.resolve(mesh);
  }

  // 更新
  update({ imageArr, renderer, scene, camera }) {
    const animate = () => {
      requestAnimationFrame(animate);
      if (this.pause) {
        return;
      }

      for (const image of imageArr) {
        if (image.obj.position.z >= this.cameraZ) {
          image.obj.position.z = this.minZ + this.spaceZ;
        }
        image.obj.position.z += this.speedZ;
      }
      renderer.render(scene, camera);
    }
    animate();
  }

  // 尺寸更新
  resize() {
    renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
  }

  // 加载贴图
  _loadTexture(image) {
    return new Promise((resolve) => {
      new THREE.TextureLoader().load(image, (txt) => {
        resolve(txt)
      });
    })
  }
}
