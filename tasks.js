 document.addEventListener('DOMContentLoaded', function() {
            // Elements
            const taskInput = document.getElementById('todo-input');
            const timeInput = document.getElementById('time-input');
            const addButton = document.getElementById('add-btn');
            const taskList = document.getElementById('task-list');
            
            // Chart setup
            const ctx = document.getElementById('progress-chart').getContext('2d');
            const progressChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'Remaining'],
                    datasets: [{
                        data: [0, 100],
                        backgroundColor: ['#5dff5d', '#2d3047'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                font: {
                                    family: 'Press Start 2P',
                                    size: 10
                                }
                            }
                        }
                    }
                }
            });

            // Task data
            let totalMinutes = 0;
            let completedMinutes = 0;
            let tasks = [];

            // Load saved tasks
            loadTasks();

            // Add task function
            addButton.addEventListener('click', function() {
                const text = taskInput.value.trim();
                const minutes = parseInt(timeInput.value);
                
                if (!text || isNaN(minutes) || minutes < 1) {
                    alert("Please enter both a task and valid time (minimum 1 minute)");
                    return;
                }

                addTask(text, minutes);
                taskInput.value = '';
                timeInput.value = '';
            });

            function addTask(text, minutes) {
                const task = {
                    id: Date.now(),
                    text,
                    minutes,
                    completed: false
                };
                
                tasks.push(task);
                totalMinutes += minutes;
                renderTask(task);
                updateChart();
                saveTasks();
            }

            function renderTask(task) {
                const taskEl = document.createElement('div');
                taskEl.className = 'task';
                taskEl.dataset.id = task.id;
                
                taskEl.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text">${task.text}</span>
                    <span class="task-time">${task.minutes} min</span>
                    <button class="task-delete">✕</button>
                `;
                
                taskList.appendChild(taskEl);

                // Add event listeners
                taskEl.querySelector('.task-checkbox').addEventListener('change', function() {
                    updateTaskStatus(task.id, this.checked);
                });
                
                taskEl.querySelector('.task-delete').addEventListener('click', function() {
                    deleteTask(task.id);
                });
            }

            function updateTaskStatus(id, isCompleted) {
                const task = tasks.find(t => t.id == id);
                if (!task) return;
                
                task.completed = isCompleted;
                
                if (isCompleted) {
                    completedMinutes += task.minutes;
                } else {
                    completedMinutes -= task.minutes;
                }
                
                updateChart();
                saveTasks();
            }

            function deleteTask(id) {
                const taskIndex = tasks.findIndex(t => t.id == id);
                if (taskIndex === -1) return;
                
                const [task] = tasks.splice(taskIndex, 1);
                totalMinutes -= task.minutes;
                
                if (task.completed) {
                    completedMinutes -= task.minutes;
                }
                
                document.querySelector(`.task[data-id="${id}"]`).remove();
                updateChart();
                saveTasks();
            }

            function updateChart() {
                const remainingMinutes = Math.max(0, totalMinutes - completedMinutes);
                const completionPercent = totalMinutes > 0 
                    ? Math.round((completedMinutes / totalMinutes) * 100) 
                    : 0;
                
                progressChart.data.datasets[0].data = [
                    completedMinutes,
                    remainingMinutes
                ];
                progressChart.update();
            }

            function saveTasks() {
                localStorage.setItem('pixel-tasks', JSON.stringify({
                    tasks,
                    totalMinutes,
                    completedMinutes
                }));
            }

            function loadTasks() {
                const saved = JSON.parse(localStorage.getItem('pixel-tasks'));
                if (!saved) return;
                
                tasks = saved.tasks || [];
                totalMinutes = saved.totalMinutes || 0;
                completedMinutes = saved.completedMinutes || 0;
                
                tasks.forEach(task => renderTask(task));
                updateChart();
            }
        });