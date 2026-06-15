document.addEventListener('DOMContentLoaded', function () {
            document.querySelectorAll('img').forEach(function(img) {
                img.classList.add('loaded');
                img.addEventListener('error', function() {
                    console.error('Не удалось загрузить изображение:', img.src);
                });
            });

            const navLeft = document.getElementById('navLeft');
            const navRight = document.getElementById('navRight');
            const pageTasks = document.getElementById('page-tasks');
            let currentSection = 'page-main';
            let previousSection = 'page-main';
            let isTransitioning = false;

            const navConfig = {
                'page-main': { 
                    left: [{ text: '🗺️ К карте', action: function() { window.location.href = 'index.html'; } }], 
                    right: [] 
                },
                'page-info': {
                    left: [
                        { text: '🗺️ К карте', action: function() { window.location.href = 'index.html'; } },
                        { text: '← Назад', action: function() { window.switchPage('page-main'); } }
                    ],
                    right: [{ text: 'К заданиям ✏️', action: function() { window.switchPage('page-tasks'); } }]
                },
                'page-tasks': {
                    left: [
                        { text: '🗺️ К карте', action: function() { window.location.href = 'index.html'; } },
                        { text: '← Назад', action: function() { window.goBackToPrevious(); } }
                    ],
                    right: []
                }
            };

            function renderNav(section) {
                const config = navConfig[section] || { left: [], right: [] };
                if (!navLeft || !navRight) return;
                navLeft.innerHTML = ''; 
                navRight.innerHTML = '';
                
                config.left.forEach(function(item) {
                    const btn = document.createElement('button');
                    btn.className = 'nav-link-btn' + (item.style ? ' ' + item.style : '');
                    btn.textContent = item.text;
                    btn.addEventListener('click', item.action);
                    navLeft.appendChild(btn);
                });
                
                config.right.forEach(function(item) {
                    const btn = document.createElement('button');
                    btn.className = 'nav-link-btn' + (item.style ? ' ' + item.style : '');
                    btn.textContent = item.text;
                    btn.addEventListener('click', item.action);
                    navRight.appendChild(btn);
                });
            }

            function switchPage(pageId) {
                if (pageId === currentSection || isTransitioning) return;
                isTransitioning = true; 
                previousSection = currentSection;
                const oldPage = document.getElementById(currentSection);
                if (oldPage) { oldPage.classList.remove('active'); oldPage.style.display = 'none'; }
                
                setTimeout(function() {
                    const newPage = document.getElementById(pageId);
                    if (newPage) { 
                        newPage.classList.add('active'); 
                        newPage.style.display = 'block';
                    }
                    currentSection = pageId;
                    if (pageId === 'page-tasks' && pageTasks) pageTasks.classList.remove('results-active');
                    renderNav(pageId);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                    setTimeout(function() { isTransitioning = false; }, 350);
                }, 300);
            }

            function goBackToPrevious() { 
                switchPage(previousSection); 
            }
            
            window.switchPage = switchPage;
            window.goBackToPrevious = goBackToPrevious;
            renderNav(currentSection);

            document.querySelectorAll('.card').forEach(function(card) {
                const btn = card.querySelector('.card-header');
                if (!btn) return;
                const body = card.querySelector('.card-body');
                btn.addEventListener('click', function() {
                    const isOpen = card.classList.contains('active');
                    document.querySelectorAll('.card.active').forEach(function(c) {
                        c.classList.remove('active');
                        c.querySelector('.card-body').style.maxHeight = null;
                        c.querySelector('.card-header').setAttribute('aria-expanded', 'false');
                    });
                    if (!isOpen) {
                        card.classList.add('active');
                        body.style.maxHeight = body.querySelector('.card-body-inner').scrollHeight + 40 + 'px';
                        btn.setAttribute('aria-expanded', 'true');
                    }
                    setTimeout(function() { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50);
                });
            });

            if (typeof window.currentQuestion === 'undefined') {
                window.currentQuestion = 1;
            }
            if (typeof window.taskData === 'undefined') {
                window.taskData = {};
            }
            if (typeof window.totalQuestions === 'undefined') {
                window.totalQuestions = 6;
            }

            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const progressWrapper = document.querySelector('.progress-bar-wrapper');

            function updateProgress() { 
                var cq = window.currentQuestion;
                var tq = window.totalQuestions;
                if (progressFill && tq > 0) {
                    var pct = Math.max(0, Math.min(100, (cq / tq) * 100));
                    progressFill.style.width = pct + '%'; 
                    progressFill.style.transition = 'width 0.4s ease';
                }
                if (progressText && tq > 0) {
                    progressText.textContent = 'Вопрос ' + cq + ' из ' + tq; 
                }
            }

            updateProgress();

            function showSlide(slideId) {
                document.querySelectorAll('.task-slide').forEach(function(s) { s.classList.remove('active'); });
                const target = document.getElementById(slideId);
                if (target) { 
                    target.classList.add('active'); 
                    var slideNum = parseInt(slideId.replace('slide', ''));
                    if (!isNaN(slideNum) && slideNum > 0) {
                        window.currentQuestion = slideNum;
                    }
                    updateProgress(); 
                }
            }

            document.querySelectorAll('.next-slide-btn').forEach(function(btn) { 
                btn.addEventListener('click', function() { 
                    var target = this.dataset.target; 
                    if (target === 'results') {
                        showResults(); 
                    } else {
                        showSlide(target); 
                    }
                }); 
            });

            function getCorrectAnswers() {
                try {
                    if (typeof window !== 'undefined' && window.CORRECT) return window.CORRECT;
                    var c = (typeof window.CORRECT !== 'undefined') ? window.CORRECT : null;
                    if (c === null && typeof CORRECT !== 'undefined') {
                        c = CORRECT;
                    }
                    return c;
                } catch(e) {
                    return null;
                }
            }

            document.querySelectorAll('.check-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var taskNum = parseInt(this.dataset.task);
                    var block = document.getElementById('task' + taskNum);
                    var feedback = document.getElementById('feedback' + taskNum);
                    
                    if (!block || !feedback) return;
                    
                    if (typeof window.taskData !== 'undefined' && window.taskData[taskNum] !== undefined) { 
                        feedback.textContent = '⚠️ Ответ уже принят.'; 
                        feedback.className = 'feedback'; 
                        return; 
                    }
                    
                    var isCorrect = false;
                    var correctMap = getCorrectAnswers();
                    var correctAnswer = correctMap ? correctMap[taskNum] : null;
                    
                    var normalizedCorrect = null;
                    if (correctAnswer !== null && correctAnswer !== undefined) {
                        normalizedCorrect = String(correctAnswer).trim().toLowerCase();
                    }

                    if (taskNum === 4 || taskNum === 6) {
                        var inp = document.getElementById('answer' + taskNum); 
                        if (!inp) return;
                        var val = inp.value.trim().toLowerCase();
                        if (!val) { 
                            feedback.textContent = '⚠️ Введи ответ.'; 
                            feedback.className = 'feedback error'; 
                            return; 
                        }

                        isCorrect = (normalizedCorrect !== null && val === normalizedCorrect);
                    } else {
                        var radio = block.querySelector('input[name="q' + taskNum + '"]:checked');
                        if (!radio) { 
                            feedback.textContent = '⚠️ Выбери вариант.'; 
                            feedback.className = 'feedback error'; 
                            return; 
                        }
                        var radioVal = radio.value.trim().toLowerCase();
                        isCorrect = (normalizedCorrect !== null && radioVal === normalizedCorrect);
                    }
                    
                    window.taskData[taskNum] = isCorrect;
                    
                    block.querySelectorAll('input').forEach(function(inp) { inp.disabled = true; });
                    
                    // Скрываем кнопку "Проверить"
                    this.style.display = 'none';
                    
                    // Показываем кнопку "Далее"
                    var nextBtn = block.querySelector('.next-slide-btn');
                    if (nextBtn) {
                        nextBtn.style.display = 'block';
                    }
                    
                    var explanation = (typeof window.EXPLANATIONS !== 'undefined' && window.EXPLANATIONS[taskNum]) ? window.EXPLANATIONS[taskNum] : '';
                    var explanationsMap = getExplanations();
                    if (explanationsMap && explanationsMap[taskNum]) explanation = explanationsMap[taskNum];

                    if (isCorrect) { 
                        feedback.textContent = 'Правильно! ' + explanation; 
                        feedback.className = 'feedback success'; 
                        block.classList.add('correct'); 
                    } else { 
                        feedback.textContent = 'Неправильно. ' + explanation; 
                        feedback.className = 'feedback error'; 
                        block.classList.add('incorrect'); 
                    }
                });
            });
            
            function getExplanations() {
                try {
                    var e = (typeof window.EXPLANATIONS !== 'undefined') ? window.EXPLANATIONS : null;
                    if (e === null && typeof EXPLANATIONS !== 'undefined') {
                        e = EXPLANATIONS;
                    }
                    return e;
                } catch(err) { return null; }
            }

            function showResults() {
                document.querySelectorAll('.task-slide').forEach(function(s) { s.classList.remove('active'); });
                
                if (progressText) progressText.style.display = 'none'; 
                if (progressWrapper) progressWrapper.style.display = 'none';
                
                if (pageTasks) {
                    pageTasks.classList.add('results-active');
                }
                
                var correctCount = 0; 
                var tq = window.totalQuestions;
                var tbody = document.getElementById('resultsBody');
                
                if (tbody && typeof window.taskData !== 'undefined' && tq > 0) {
                    tbody.innerHTML = '';
                    for (var i = 1; i <= tq; i++) {
                        var tr = document.createElement('tr'); 
                        tr.style.borderBottom = '1px solid #e2e8f0';
                        tr.innerHTML = '<td style="padding: 8px;">Задание ' + i + '</td><td style="padding: 8px;">' + (window.taskData[i] ? '✅ Верно' : '❌ Неверно') + '</td>'; 
                        tbody.appendChild(tr); 
                        if (window.taskData[i]) correctCount++;
                    }
                    
                    var msg = '';
                    if (correctCount === tq) msg = '🏆 Отлично! Все ответы верные!';
                    else if (correctCount >= 4) msg = '👏 Хорошо! Правильных ответов: ' + correctCount + ' из ' + tq + '.';
                    else if (correctCount >= 2) msg = '📖 Неплохо! ' + correctCount + ' из ' + tq + '. Перечитай материал.';
                    else msg = '💪 ' + correctCount + ' из ' + tq + '. Прочитай карточки и попробуй снова.';
                    
                    var resultsText = document.getElementById('resultsText');
                    if (resultsText) resultsText.textContent = msg;
                }
                
                var resultsSlide = document.getElementById('resultsSlide');
                if (resultsSlide) {
                    resultsSlide.classList.add('active');
                }
            }

            var retryBtn = document.getElementById('retryBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', function() {
                    window.taskData = {}; 
                    window.currentQuestion = 1;
                    
                    document.querySelectorAll('.task-block').forEach(function(b) {
                        b.classList.remove('correct', 'incorrect'); 
                        b.querySelectorAll('input').forEach(function(inp) { 
                            inp.disabled = false; 
                            if (inp.type === 'checkbox' || inp.type === 'radio') {
                                inp.checked = false; 
                            } else {
                                inp.value = ''; 
                            }
                        });
                        var fb = b.querySelector('.feedback'); 
                        if (fb) { fb.textContent = ''; fb.className = 'feedback'; }
                        
                        var checkBtn = b.querySelector('.check-btn'); 
                        if (checkBtn) { 
                            checkBtn.disabled = false; 
                            checkBtn.textContent = 'Проверить'; 
                            checkBtn.style.display = 'inline-block'; 
                        }
                        
                        var nextBtn = b.querySelector('.next-slide-btn');
                        if (nextBtn) { 
                            nextBtn.style.display = 'none'; 
                        }
                    });
                    
                    document.querySelectorAll('.task-slide').forEach(function(s) { s.classList.remove('active'); });
                    
                    var slide1 = document.getElementById('slide1');
                    if (slide1) slide1.classList.add('active');
                    
                    var resultsSlide = document.getElementById('resultsSlide');
                    if (resultsSlide) resultsSlide.classList.remove('active');
                    
                    if (progressText) progressText.style.display = 'block'; 
                    if (progressWrapper) progressWrapper.style.display = 'block';
                    
                    if (pageTasks) pageTasks.classList.remove('results-active'); 
                    
                    renderNav('page-tasks'); 
                    updateProgress();
                });
            }

            var backToMapBtn = document.getElementById('backToMapBtn');
            if (backToMapBtn) {
                backToMapBtn.addEventListener('click', function() { window.location.href = 'index.html'; });
            }
        });