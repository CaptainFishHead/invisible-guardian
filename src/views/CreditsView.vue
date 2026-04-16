<template>
  <div class="credits-view" @click="router.push('/')">
    <div class="credits-content" :style="{ transform: `translateY(-${scrollPosition}px)` }">
      <h1>制作人员</h1>

      <section v-for="section in credits" :key="section.title">
        <h2>{{ section.title }}</h2>
        <div class="credit-list">
          <div v-for="person in section.people" :key="person.name" class="credit-item">
            <span class="role">{{ person.role }}</span>
            <span class="name">{{ person.name }}</span>
          </div>
        </div>
      </section>

      <div class="thanks">
        <h2>特别感谢</h2>
        <p>所有支持我们的玩家</p>
      </div>

      <div class="copyright">
        <p>© 2024 Moonshot Games. All rights reserved.</p>
        <button @click.stop="router.push('/')">返回主菜单</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'

  const router = useRouter()
  const scrollPosition = ref(0)
  let animationId: number

  const credits = [
    // {
    //   title: '制作团队',
    //   people: [
    //     { role: '制作人', name: '张三' },
    //     { role: '导演', name: '李四' },
    //     { role: '编剧', name: '王五' }
    //   ]
    // },
    // {
    //   title: '演员',
    //   people: [
    //     { role: '肖途', name: '演员A' },
    //     { role: '方敏', name: '演员B' },
    //     { role: '庄晓曼', name: '演员C' }
    //   ]
    // },
    {
      title: '技术',
      people: [
        { role: '程序', name: '汇贤学堂' },
        { role: '美术', name: '汇贤学堂' },
        { role: '音效', name: '汇贤学堂' }
      ]
    }
  ]

  onMounted(() => {
    const animate = () => {
      scrollPosition.value += 1
      animationId = requestAnimationFrame(animate)
    }
    animate()
  })

  onUnmounted(() => {
    cancelAnimationFrame(animationId)
  })
</script>

<style scoped lang="scss">
  .credits-view {
    position: fixed;
    inset: 0;
    background: #000;
    color: #fff;
    overflow: hidden;
    cursor: pointer;
  }

  .credits-content {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    text-align: center;
    padding: 100px 20px;
  }

  .credits-content h1 {
    font-size: 48px;
    font-weight: 300;
    letter-spacing: 20px;
    margin-bottom: 100px;
  }

  section {
    margin-bottom: 80px;
  }

  section h2 {
    font-size: 24px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 30px;
    text-transform: uppercase;
    letter-spacing: 8px;
  }

  .credit-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .credit-item {
    display: flex;
    justify-content: center;
    gap: 40px;
    font-size: 18px;
  }

  .role {
    color: rgba(255, 255, 255, 0.6);
    width: 120px;
    text-align: right;
  }

  .name {
    color: #fff;
    width: 120px;
    text-align: left;
  }

  .thanks {
    margin: 100px 0;
  }

  .thanks h2 {
    margin-bottom: 20px;
  }

  .thanks p {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.8);
  }

  .copyright {
    margin-top: 200px;
    padding-bottom: 100px;
  }

  .copyright p {
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 40px;
  }

  .copyright button {
    padding: 16px 40px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .copyright button:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
