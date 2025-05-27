fetch('./data.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('comments-container');

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

    function renderComments(comments , container){
      container.innerHTML = ''
      comments.forEach(comment => {
              const commentElement = createCommentElement(comment);
      container.appendChild(commentElement);

      // Replies (if any)
      if (comment.replies && comment.replies.length > 0) {
        const repliesContainer = document.createElement('div');
        repliesContainer.className = 'replies-container';

        comment.replies.forEach(reply => {
          const replyElement = createCommentElement(reply, true);
          repliesContainer.appendChild(replyElement);
        });

        container.appendChild(repliesContainer);
      }
      })
    }
    
    function sortCommentByScore(comments){
        return [...comments]
        .map(comment => ({
          ...comment,
          replies: [...comment.replies].sort((a , b) => b.score - a.score)
        }))
        .sort((a,b) => b.score - a.score)
        
    }

    function createReplyForm(currentUserImage){
         const replyForm = document.createElement('div');
    replyForm.className = 'reply-form-container';
    replyForm.innerHTML = `
    <img src="./images/avatars/image-juliusomo.png" alt="Your avatar" class="current-user-avatar">
      <textarea class="reply-textarea" placeholder="Write your reply..."></textarea>
      <div class="reply-form-actions">
        <button class="submit-reply">REPLY</button>
        <button class="cancel-reply">CANCEL</button>
      </div>
    `;
    return replyForm
    }

    function createNewComment(text , currentUser){
      return (
        {
             id: Date.now(),
                content: text,
                createdAt: 'Just now',
                score: 0,
                user: currentUser,
                replies:[]
        }
      )
    }

    function createNewReply(text , currentUser ,  replyingTo){
      return ({
            id: Date.now(), 
            content: text,
            createdAt: "Just now",
            score: 0,
            replyingTo,
            user: currentUser
      })
    }

    function saveCommentsToLocalStorage(comments){
      try { localStorage.setItem('commentsData' , JSON.stringify(comments))
      }
      catch(error){
        console.error("failed to save comments to locastorage");
        
      }
    }

    function loadCommentsFromLocalStorage(){
    try{
        const stored = localStorage.getItem('commentsData')
      return stored ? JSON.parse(stored) : null
    }
    catch(error){
      console.error("Failed to load comments from localstorage: " , error);
      return null
      
    }
    }
    let comments = loadCommentsFromLocalStorage() || data.comments;
    renderComments(comments , container)



  

    document.addEventListener('click' , e => {
//   const sendBtn = e.target.closest('.send-button')
let commentToDelete = null
  const replyBtn = e.target.closest('.reply-btn');
  if (replyBtn) {
    const comment = replyBtn.closest('.comment');

    // Remove any existing reply forms
    document.querySelectorAll('.reply-form-container').forEach(box => box.remove());



    const replyForm = createReplyForm(data.currentUser.image.png)

    // Insert after the comment element
    comment.insertAdjacentElement('afterend', replyForm);

    replyForm.querySelector('textarea').focus()
    replyForm.scrollIntoView({behavior: 'smooth' , block: 'start'})

    return;
  }
        if(e.target.classList.contains('cancel-reply')){
            const replyForm = e.target.closest('.reply-form-container')
            replyForm.style.display = 'none'
            return
        }

        if (e.target.classList.contains('submit-reply')) {
        const replyForm = e.target.closest('.reply-form-container');
        const textarea = replyForm.querySelector('textarea');
        const text = textarea.value.trim();
        
       if(text.length == 0){
            // alert("Please type something!");
              document.getElementById('alert-dialog').showModal()

            document.querySelector('.error-confirm').addEventListener('click' , () =>{
            document.getElementById('alert-dialog').close()
                textarea.focus()
            })
        }

        else{
          console.log("Reply submitted: " + text);

        const parentComment = replyForm.previousElementSibling;
        const parentCommentId = parseInt(parentComment.dataset.id)
          
          const newReply = createNewReply(text , data.currentUser)

          const commentObj = comments.find(c => c.id === parentCommentId)
          if(commentObj){
            commentObj.replies.push(newReply)
            saveCommentsToLocalStorage(comments)
            renderComments(comments , container)

            const newReplyElement = container.querySelector(`[data-id='${newReply.id}']`)
            if(newReplyElement){
              newReplyElement.scrollIntoView({ behavior: 'smooth' , block: 'start'})
            }
          }

          textarea.value = '';
          replyForm.style.display = 'none';
        }
      }

      else if(e.target.classList.contains('send-button')){
        console.log("Send button clicked");
        
        const addCommentDiv = e.target.closest('.add-comment')
        const textarea = addCommentDiv.querySelector('textarea')
        const text  = textarea.value.trim()

        if(text.length == 0){
          document.querySelector('.alert-dialog').showModal()

            document.querySelector('.error-confirm').addEventListener('click' , () =>{
            document.querySelector('.alert-dialog').close()
                textarea.focus()
            })
        }
        else{
            console.log("Comment added: " + text)            
            const newComment = createNewComment(text , data.currentUser)

            comments.push(newComment)
            saveCommentsToLocalStorage(comments)
            renderComments(comments, container)
            const allCommentElements = container.querySelectorAll('.comment');
            const lastCommentElement = allCommentElements[allCommentElements.length - 1];
            lastCommentElement.scrollIntoView({ behavior: "smooth", block: "start" });
            textarea.value = ''
        }
      }

      



      else if(e.target.closest('.delete-btn')){
    const deleteBtn = e.target.closest('.delete-btn');
    const comment = deleteBtn.closest('.comment');
    const dialog = document.getElementById('delete-dialog');

    if(comment && dialog){
        commentToDelete = comment;
        dialog.showModal(); 
        
       
    }

   
    document.querySelector('.cancel-delete').addEventListener('click', () => {
        dialog.close(); 
        commentToDelete = null;
    });

    document.querySelector('.confirm-delete').addEventListener('click', () => {
        if(commentToDelete){
            // const next = commentToDelete.nextElementSibling;
            // if(next && next.classList.contains('replies-container') && next.children.length === 0){
            //     next.remove();
            // }
            // commentToDelete.remove();
            const commentId = parseInt(commentToDelete.dataset.id)

            let deleted = false
            for(let i = 0; i < comments.length; i++){
              if(comments[i].id === commentId){
                comments.splice(i, 1)
                deleted = true
                break
              }

              if(comments[i].replies && comments[i].replies.length > 0){
                const replyindex = comments[i].replies.findIndex(reply => reply.id === commentId)
                if(replyindex !== -1){
                  comments[i].replies.splice(replyindex , 1)
                  deleted = true
                  break
                }
              }

            }
            if(deleted){

              commentToDelete.classList.add('fade-out')
              setTimeout(() => {
                const next = commentToDelete.nextElementSibling
                if(next && next.classList.contains('replies-container') && next.children.length === 0){
                  next.remove()
                }

                commentToDelete.remove()
                saveCommentsToLocalStorage(comments)
              renderComments(comments , container)


               console.log("COmment deleted")
            commentToDelete = null;
            dialog.close(); 
              } , 300)

              
            }

           
        }
    });
}

      else if(e.target.closest('.edit-btn')){
         const editBtn = e.target.closest('.edit-btn')
         const comment = editBtn.closest('.comment')
         const contentP = comment.querySelector('.comment-text')

         const openTextarea = document.querySelector('.edit-textarea');
  if (openTextarea) {
    const parentComment = openTextarea.closest('.comment');
    const original = parentComment.querySelector('.comment-text').dataset.original;
    if (original) {
      parentComment.querySelector('.comment-text').innerHTML = original;
    }
  }

        
         if(comment.querySelector('.textarea')) return

         const replyingToSpan = contentP.querySelector('.replying-to')
         const replyToText = replyingToSpan ? replyingToSpan.outerHTML : ''
         const fullText = contentP.innerText
         const rawText = replyingToSpan ? fullText.replace(replyingToSpan.innerText , '').trim() : fullText

         contentP.dataset.original = contentP.innerHTML

         contentP.innerHTML = `
          ${replyToText}
          <textarea class="edit-textarea">${rawText}</textarea>
         <div class="edit-action">
          <button class="update-btn">UPDATE</button>
          <button class="cancel-edit-btn">CANCEL</button>
          </div>
         `

         comment.querySelector('.edit-textarea').focus()
         comment.querySelector('.edit-textarea').scrollIntoView({behavior : "smooth" , block : 'start'})
         return
      }

      else if(e.target.classList.contains('update-btn')){
        const commentElement = e.target.closest('.comment');
        const comment = e.target.closest('.comment')
        const textarea = comment.querySelector('.edit-textarea')
        const newText = textarea.value.trim()
        const replyingTo = comment.querySelector('.replying-to')

        if(newText.length === 0){
           document.getElementById('alert-dialog').showModal()

            document.querySelector('.error-confirm').addEventListener('click' , () =>{
            document.getElementById('alert-dialog').close()
                textarea.focus()
            })
            return
        }

        const commentId = parseInt(commentElement.dataset.id)

        let updated = false
        for(let comment of comments){
          if(comment.id === commentId){
            comment.content = newText
            updated = true
            break
          }
          if(comment.replies && comment.replies.length > 0){
            for(let reply of comment.replies){
              if(reply.id === commentId){
                reply.content = newText
                updated = true
                break
              }
            }
          }
          if(updated) break
        }

        if(updated){
          saveCommentsToLocalStorage(comments)
          renderComments(comments , container)

          const updatedElement = document.querySelector(`.comment[data-id="${commentId}"]`)
          updatedElement.scrollIntoView({behavior: "smooth" , block: "center"})
        }


      }

     else if(e.target.classList.contains('cancel-edit-btn')){
      const comment = e.target.closest('.comment')
      const contentP = comment.querySelector('.comment-text')
      const original = contentP.dataset.original

      if(original){
        contentP.innerHTML = original
      }
     }

     else if(e.target.classList.contains('vote-btn')){
      const voteCounter = e.target.closest('.comment')
      const scoreElement = voteCounter.querySelector('.vote-score')
      let score = parseInt(scoreElement.textContent)

      if(e.target.classList.contains('upvote')) score++
      else if(e.target.classList.contains('downvote') && score > 0) score--
      
      scoreElement.textContent = score

      const commentId = parseInt(voteCounter.dataset.id)
      const isReply = voteCounter.classList.contains('reply')

      if(isReply){
        comments.forEach(comment => {
          const reply = comment.replies.find(r => r.id === commentId)
          if(reply) reply.score = score
        })
      }
      else{
        const targetComment = comments.find(c => c.id === commentId)
        if(targetComment) targetComment.score = score
      }

      const oldOrder = comments.map(c => c.id)

      const sortedComments = sortCommentByScore(comments)

      const newOrder = sortedComments.map(c => c.id)
      saveCommentsToLocalStorage(comments)
      comments = sortedComments

      const orderChanged = !oldOrder.every((id, index) => id === newOrder[index])

      if(orderChanged){
      container.style.opacity = 0

      setTimeout(() => {
      
        renderComments(sortedComments , container)

        container.style.opacity = 1

      } , 300)
     }
     else renderComments(sortedComments , container)
    }
      

    })

  })
  .catch(error => {
    console.error("Error loading JSON:", error);
  });
