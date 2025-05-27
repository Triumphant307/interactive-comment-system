fetch('./data.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('comments-container');
    let replyingTo = null; // Track if we're replying to someone

    // Create comment element
    function createCommentElement(comment, isReply = false) {
      const isCurrentUser = comment.user.username === data.currentUser.username;
      const commentDiv = document.createElement('div');
      commentDiv.className = `comment ${isReply ? 'reply' : ''}`;
      commentDiv.dataset.id = comment.id;

      commentDiv.innerHTML = `
        <div class="vote-counter">
          <button class="vote-btn upvote" aria-label="Upvote">+</button>
          <span class="vote-score">${comment.score}</span>
          <button class="vote-btn downvote" aria-label="Downvote">−</button>
        </div>
        <div class="comment-content">
          <div class="comment-header">
            <img src="${comment.user.image.png}" alt="${comment.user.username}" class="avatar">
            <span class="username">${comment.user.username}</span>
            ${isCurrentUser ? '<span class="you-badge">you</span>' : ''}
            <span class="timestamp">${comment.createdAt}</span>
            <div class="actions">
              ${isCurrentUser ? `
                <button class="action-btn delete-btn" data-id="${comment.id}">
                  <img src="./images/icon-delete.svg" alt="Delete"> Delete
                </button>
                <button class="action-btn edit-btn" data-id="${comment.id}">
                  <img src="./images/icon-edit.svg" alt="Edit"> Edit
                </button>
              ` : `
                <button class="action-btn reply-btn" data-username="${comment.user.username}" data-id="${comment.id}">
                  <img src="./images/icon-reply.svg" alt="Reply"> Reply
                </button>
              `}
            </div>
          </div>
          <p class="comment-text">
            ${comment.replyingTo ? `<span class="replying-to">@${comment.replyingTo}</span> ` : ''}
            ${comment.content}
          </p>
        </div>
      `;

      return commentDiv;
    }

    // Create add comment section
    function createAddCommentSection(currentUser, replyingTo = null) {
      const addCommentDiv = document.createElement('div');
      addCommentDiv.className = 'add-comment current-user';
      addCommentDiv.innerHTML = `
        <img src="${currentUser.image.png}" alt="${currentUser.username}" class="avatar">
        <textarea placeholder="${replyingTo ? `Replying to @${replyingTo}` : 'Add a comment...'}" id="comment-text"></textarea>
        <button class="send-btn" id="send-comment">${replyingTo ? 'REPLY' : 'SEND'}</button>
      `;
      return addCommentDiv;
    }

    // Add new comment to data
    function addNewComment(content) {
      const newComment = {
        id: Date.now(),
        content: content,
        createdAt: 'Just now',
        score: 0,
        user: data.currentUser,
        replies: []
      };
      data.comments.push(newComment);
    }

    // Add reply to a comment
    function addReply(content, replyingTo) {
      const newReply = {
        id: Date.now(),
        content: content,
        createdAt: 'Just now',
        score: 0,
        user: data.currentUser,
        replyingTo: replyingTo
      };

      // Find parent comment and add reply
      const parentComment = data.comments.find(c => 
        c.user.username === replyingTo || 
        c.replies?.some(r => r.user.username === replyingTo)
      );
      
      if (parentComment) {
        parentComment.replies = parentComment.replies || [];
        parentComment.replies.push(newReply);
      }
    }

    // Render all comments
    function renderAllComments() {
      container.innerHTML = '';
      
      data.comments.forEach(comment => {
        container.appendChild(createCommentElement(comment));
        
        if (comment.replies?.length) {
          const repliesContainer = document.createElement('div');
          repliesContainer.className = 'replies-container';
          
          comment.replies.forEach(reply => {
            repliesContainer.appendChild(createCommentElement(reply, true));
          });
          
          container.appendChild(repliesContainer);
        // comment.appendChild(repliesContainer)
        }
      });

      // Add comment box
      const addCommentSection = createAddCommentSection(data.currentUser, replyingTo);
      container.appendChild(addCommentSection);

      // Focus textarea if replying
      if (replyingTo) {
        document.getElementById('comment-text').focus();
      }
    }

    // Initial render
    renderAllComments();

    // Event delegation for all interactive elements
    container.addEventListener('click', function(e) {
      const target = e.target.closest('button');
      if (!target) return;

      // Voting
      if (target.classList.contains('vote-btn')) {
        const voteCounter = target.closest('.vote-counter');
        const scoreElement = voteCounter.querySelector('.vote-score');
        let score = parseInt(scoreElement.textContent);
        
        if (target.classList.contains('upvote')) score++;
        else if (target.classList.contains('downvote')) score--;
        
        scoreElement.textContent = score;
      }
      
      // Reply button
      else if (target.classList.contains('reply-btn')) {
        replyingTo = target.dataset.username;
        renderAllComments();
      }
      
      // Send comment/reply
      else if (target.id === 'send-comment') {
        const textarea = document.getElementById('comment-text');
        const content = textarea.value.trim();
        
        if (content) {
          if (replyingTo) {
            addReply(content, replyingTo);
          } else {
            addNewComment(content);
          }
          replyingTo = null;
          renderAllComments();
        }
      }
      
      // Delete button
      else if (target.classList.contains('delete-btn')) {
        const commentId = parseInt(target.dataset.id);
        // Remove from comments or replies
        data.comments = data.comments.filter(c => c.id !== commentId);
        data.comments.forEach(c => {
          if (c.replies) {
            c.replies = c.replies.filter(r => r.id !== commentId);
          }
        });
        renderAllComments();
      }
      
      // Edit button
      else if (target.classList.contains('edit-btn')) {
        const commentId = parseInt(target.dataset.id);
        // Find comment
        let comment = data.comments.find(c => c.id === commentId) || 
                     data.comments.flatMap(c => c.replies || []).find(r => r.id === commentId);
        
        if (comment) {
          // Replace with textarea for editing
          const commentDiv = target.closest('.comment');
          const contentDiv = commentDiv.querySelector('.comment-text');
          contentDiv.innerHTML = `
            <textarea class="edit-textarea">${comment.content}</textarea>
            <button class="update-btn" data-id="${commentId}">UPDATE</button>
          `;
        }
      }
      
      // Update edited comment
      else if (target.classList.contains('update-btn')) {
        const commentId = parseInt(target.dataset.id);
        const textarea = target.previousElementSibling;
        const newContent = textarea.value.trim();
        
        if (newContent) {
          // Find and update comment
          let comment = data.comments.find(c => c.id === commentId) || 
                       data.comments.flatMap(c => c.replies || []).find(r => r.id === commentId);
          
          if (comment) {
            comment.content = newContent;
            renderAllComments();
          }
        }
      }
    });
  })
  .catch(error => {
    console.error("Error loading JSON:", error);
  });