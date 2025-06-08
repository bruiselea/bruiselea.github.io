// モバイルメニューの制御
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // ハンバーガーメニューのクリックイベント
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // ナビゲーションリンクのクリックイベント
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // スクロール時のナビゲーションバーの背景変更
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    });

    // お問い合わせフォームの送信処理
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // フォームデータの取得
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');

            // 簡単なバリデーション
            if (!name || !email || !subject || !message) {
                alert('すべての項目を入力してください。');
                return;
            }

            // メールアドレスの簡単なバリデーション
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('有効なメールアドレスを入力してください。');
                return;
            }

            // 送信ボタンの状態変更
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '送信中...';
            submitBtn.disabled = true;

            // 実際のフォーム送信処理（ここでは模擬）
            setTimeout(() => {
                alert('お問い合わせをありがとうございます。後日ご連絡いたします。');
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1000);
        });
    }

    // スクロール時のアニメーション
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);

    // アニメーション対象要素の監視
    const animateElements = document.querySelectorAll('.skill-category, .project-card, .highlight');
    animateElements.forEach(el => {
        observer.observe(el);
    });

    // スキルアイテムのホバーエフェクト
    const skillItems = document.querySelectorAll('.skill-item');
    skillItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(10px) scale(1.02)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0) scale(1)';
        });
    });

    // プロジェクトカードのインタラクション
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('click', function() {
            // クリック時の処理（将来的にはモーダルやプロジェクト詳細ページに展開可能）
            console.log('プロジェクトカードがクリックされました:', this.querySelector('h3').textContent);
        });
    });

    // ページ内リンクのスムーズスクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // パフォーマンス最適化のための画像遅延読み込み
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
});

// ウィンドウリサイズ時の処理
window.addEventListener('resize', function() {
    const navMenu = document.querySelector('.nav-menu');
    const hamburger = document.querySelector('.hamburger');
    
    if (window.innerWidth > 768) {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// スクロール位置の保存と復元
window.addEventListener('beforeunload', function() {
    localStorage.setItem('scrollPosition', window.scrollY);
});

window.addEventListener('load', function() {
    const savedPosition = localStorage.getItem('scrollPosition');
    if (savedPosition) {
        window.scrollTo(0, parseInt(savedPosition));
        localStorage.removeItem('scrollPosition');
    }
});

// キーボードナビゲーション対応
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const navMenu = document.querySelector('.nav-menu');
        const hamburger = document.querySelector('.hamburger');
        
        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        }
    }
});

// ダークモードの切り替え（将来的な拡張用）
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// ダークモードの設定復元
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
} 