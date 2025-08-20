// AI Assistant page specific logic (Vue instance separated)
const geminiApiKey = 'REDACTED_API_KEY_PLACEHOLDER'; // Replace securely server-side

if (document.getElementById('app')) {
  new Vue({
    el: '#app',
    data: { messages: [], newMessage: '', errorMessage: '' },
    methods: {
      async sendMessage() {
        if (!this.newMessage.trim()) return;
        const userTxt = this.newMessage.trim();
        this.messages.push({ sender: 'user', text: userTxt });
        this.newMessage = '';
        const thinkingIndex = this.messages.length;
        this.messages.push({ sender: 'rishabh', text: 'Thinking...' });
        try {
          const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, { contents: [{ parts: [{ text: userTxt }] }] });
          let reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process your request.';
          this.messages.splice(thinkingIndex, 1, { sender: 'rishabh', text: reply.trim() });
        } catch (e) {
          this.messages.splice(thinkingIndex, 1, { sender: 'rishabh', text: 'Error processing your request.' });
        }
      }
    }
  });
}
