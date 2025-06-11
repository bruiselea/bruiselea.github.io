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
    const animateElements = document.querySelectorAll('.skill-category, .project-card, .highlight, .gallery-item');
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

    // ギャラリーフィルター機能
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // アクティブボタンの切り替え
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const filterValue = this.getAttribute('data-filter');

            // ギャラリーアイテムのフィルタリング
            galleryItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filterValue === 'all' || category === filterValue) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });

    // 作品データ
    const worksData = {
        'phone-stand': {
            title: 'Miband Stand',
            status: 'completed',
            icon: 'fas fa-cube',
            description: 'フリマサイトにて販売。充電を美しく見せる設計。',
            specs: [
                '材質: PLA樹脂',
                'サイズ: 120mm x 80mm x 95mm',
                '対応デバイス: 4-7インチスマートフォン',
                '印刷時間: 約3時間',
                '後処理: サンディング + 塗装'
            ],
            progress: 100,
            purchaseLink: '', // 販売開始時にここにリンクを設定 (例: 'https://store.example.com/phone-stand')
            price: '¥2,980'
        },
        'gear-mechanism': {
            title: '歯車機構パズル',
            status: 'completed',
            icon: 'fas fa-cog',
            description: '教育用途を想定した組み立て式歯車システム。複数の歯車を組み合わせることで、機械工学の基礎概念を学習できます。',
            specs: [
                '材質: PETG樹脂',
                '歯車数: 8個',
                'ギア比: 1:2, 1:3, 1:4',
                '印刷時間: 約5時間',
                'サポート材: 不要'
            ],
            progress: 100,
            purchaseLink: '', // 販売開始時にここにリンクを設定 (例: 'https://store.example.com/gear-mechanism')
            price: '¥4,500'
        },
        'desk-organizer': {
            title: 'デスクオーガナイザー',
            status: 'completed',
            icon: 'fas fa-tools',
            description: 'モジュラー設計により自由にカスタマイズできるデスクオーガナイザー。必要に応じて部品を追加・削除でき、様々なワークスペースに対応します。',
            specs: [
                '材質: ABS樹脂',
                'モジュール数: 6種類',
                '接続方式: マグネット + 嵌合',
                '印刷時間: 約8時間（全セット）',
                'カラー: グレー、ブラック、ホワイト'
            ],
            progress: 100,
            purchaseLink: '', // 販売開始時にここにリンクを設定 (例: 'https://store.example.com/desk-organizer')
            price: '¥6,800'
        },
        'smart-lamp': {
            title: 'スマートランプ',
            status: 'concept',
            icon: 'fas fa-lightbulb',
            description: 'AI搭載の適応照明システム。時間帯、環境光、ユーザーの活動パターンを学習し、最適な照明環境を自動的に提供します。',
            specs: [
                '予定材質: PC樹脂 + アルミニウム',
                'センサー: 環境光、人感、RGB',
                '制御: ESP32マイコン',
                'AI機能: 機械学習ベースの自動調整',
                '接続: Wi-Fi、Bluetooth'
            ],
            progress: 25
        },
        'plant-monitor': {
            title: '植物モニタリングシステム',
            status: 'concept',
            icon: 'fas fa-seedling',
            description: 'IoTセンサーによる自動植物管理システム。土壌湿度、光量、温度を監視し、最適なタイミングで水やりを実行します。',
            specs: [
                '予定材質: PETG樹脂 + 防水コーティング',
                'センサー: 土壌湿度、温湿度、照度',
                'ポンプ: ペリスタリックポンプ',
                '制御: Arduino Nano',
                'アプリ: Flutter製モバイルアプリ'
            ],
            progress: 40
        },
        'assembly-robot': {
            title: '自動組立ロボット',
            status: 'concept',
            icon: 'fas fa-robot',
            description: '3Dプリント部品の自動組立を行うロボットシステム。画像認識により部品を識別し、プログラムされた手順で組立作業を実行します。',
            specs: [
                '予定材質: アルミニウムフレーム',
                'アクチュエータ: ステッピングモーター',
                '画像認識: OpenCV + TensorFlow',
                '制御: Raspberry Pi 4',
                'プログラミング: Python + ROS'
            ],
            progress: 15
        }
    };

    // モーダル機能
    const modal = document.getElementById('workModal');
    const closeBtn = document.querySelector('.close');
    const viewButtons = document.querySelectorAll('.view-btn');

    viewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const workId = this.getAttribute('data-work');
            const workData = worksData[workId];
            
            if (workData) {
                // モーダルに内容を設定
                document.getElementById('modalTitle').textContent = workData.title;
                document.getElementById('modalStatus').textContent = workData.status === 'completed' ? '完成' : '構想中';
                document.getElementById('modalStatus').className = `gallery-status ${workData.status}`;
                document.getElementById('modalIcon').className = `${workData.icon} fa-4x`;
                document.getElementById('modalDescription').textContent = workData.description;
                
                // 技術仕様のリスト作成
                const specsList = document.getElementById('modalSpecs');
                specsList.innerHTML = '';
                workData.specs.forEach(spec => {
                    const li = document.createElement('li');
                    li.textContent = spec;
                    specsList.appendChild(li);
                });
                
                // 進捗バーの設定
                const progressFill = document.querySelector('.progress-fill');
                const progressText = document.querySelector('.progress-text');
                progressFill.style.width = `${workData.progress}%`;
                progressText.textContent = `${workData.progress}%`;
                
                // 構想中の場合は進捗セクションを表示
                const progressSection = document.getElementById('modalProgress');
                progressSection.style.display = workData.status === 'concept' ? 'block' : 'none';
                
                // 購入ボタンの設定
                const purchaseBtn = document.getElementById('purchaseBtn');
                const inquiryBtn = document.getElementById('inquiryBtn');
                
                if (workData.status === 'completed' && workData.price) {
                    purchaseBtn.style.display = 'flex';
                    
                    // 価格をボタンに表示
                    const btnText = purchaseBtn.querySelector('i').nextSibling;
                    if (btnText) {
                        btnText.textContent = ` ${workData.price}で購入`;
                    } else {
                        purchaseBtn.innerHTML = `<i class="fas fa-shopping-cart"></i> ${workData.price}で購入`;
                    }
                    
                    // 購入リンクが設定されている場合は有効化
                    if (workData.purchaseLink) {
                        purchaseBtn.disabled = false;
                        purchaseBtn.onclick = () => {
                            window.open(workData.purchaseLink, '_blank');
                        };
                    } else {
                        purchaseBtn.disabled = true;
                        purchaseBtn.title = '販売準備中です';
                    }
                } else {
                    purchaseBtn.style.display = 'none';
                }
                
                // お問い合わせボタンの機能
                inquiryBtn.onclick = () => {
                    closeModal();
                    // お問い合わせセクションにスクロール
                    const contactSection = document.getElementById('contact');
                    if (contactSection) {
                        const headerOffset = 80;
                        const elementPosition = contactSection.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                        
                        // 作品名をお問い合わせフォームの件名に設定
                        setTimeout(() => {
                            const subjectField = document.querySelector('input[name="subject"]');
                            if (subjectField) {
                                subjectField.value = `${workData.title}について`;
                            }
                        }, 500);
                    }
                };
                
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    });

    // モーダルを閉じる
    closeBtn.addEventListener('click', closeModal);
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
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