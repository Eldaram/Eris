<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true
  },
  id: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="form-group">
    <label :for="id">{{ label }}</label>
    <input 
      :id="id" 
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :type="type" 
      :placeholder="placeholder" 
      :required="required" 
    />
  </div>
</template>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

label {
  font-weight: 500;
  font-size: 0.9rem;
  color: var(--text-main, rgba(255, 255, 255, 0.87));
}

input {
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--input-border, #444);
  background-color: var(--input-bg, #1a1a1a);
  color: var(--text-main, #fff);
  font-size: 1rem;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: var(--primary, #646cff);
}

input:invalid:not(:placeholder-shown) {
  border-color: var(--invalid, #ff4c4c);
}

input:valid:not(:placeholder-shown) {
  border-color: var(--valid, #42b883);
}
</style>
