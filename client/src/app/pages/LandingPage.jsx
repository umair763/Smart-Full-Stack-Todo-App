'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
   HiCheckCircle,
   HiUsers,
   HiBell,
   HiDocumentText,
   HiChartBar,
   HiDevicePhoneMobile,
   HiArrowRight,
   HiPlay,
   HiStar,
   HiShieldCheck,
   HiGlobeAlt,
   HiClock,
   HiLightBulb,
} from 'react-icons/hi2';
import { HiMenu, HiX } from 'react-icons/hi';

const LandingPage = () => {
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [activeFeature, setActiveFeature] = useState(0);

   // Auto-rotate features
   useEffect(() => {
      const interval = setInterval(() => {
         setActiveFeature((prev) => (prev + 1) % 6);
      }, 4000);
      return () => clearInterval(interval);
   }, []);

   const features = [
      {
         icon: HiLightBulb,
         title: 'Intelligent Task Management',
         description:
            'Create tasks with dependencies, subtasks, and priorities. Watch your workflow optimize itself as you work.',
         color: 'from-purple-500 to-pink-500',
      },
      // {
      //    icon: HiUsers,
      //    title: 'Real-Time Collaboration',
      //    description: 'See updates instantly. Know what your team is working on without constant check-ins.',
      //    color: 'from-blue-500 to-cyan-500',
      // },
      {
         icon: HiBell,
         title: 'Smart Reminders & Notifications',
         description: 'Smart reminders that learn your patterns. Get notified when dependencies are ready.',
         color: 'from-green-500 to-emerald-500',
      },
      {
         icon: HiDocumentText,
         title: 'Rich Context & Attachments',
         description: 'Add notes, files, images. Everything related to your task lives in one spot.',
         color: 'from-orange-500 to-red-500',
      },
      {
         icon: HiChartBar,
         title: 'Powerful Analytics',
         description: 'See patterns, track progress, identify bottlenecks. Make data-driven decisions about your time.',
         color: 'from-indigo-500 to-purple-500',
      },
      {
         icon: HiDevicePhoneMobile,
         title: 'Universal Access',
         description: 'Beautiful dark/light themes. Works perfectly on phone, tablet, desktop. Always in sync.',
         color: 'from-teal-500 to-blue-500',
      },
   ];

   const testimonials = [
      {
         name: 'Sarah Chen',
         role: 'Project Manager',
         company: 'TechCorp',
         content:
            'Finally, a todo app that thinks like I do. The dependency features alone saved our team 10 hours a week.',
         rating: 5,
      },
      {
         name: 'Marcus Rodriguez',
         role: 'Startup Founder',
         company: 'InnovateLab',
         content:
            'Switched our entire team from other tools. The real-time updates and smart reminders are game-changers.',
         rating: 5,
      },
      {
         name: 'Dr. Amy Thompson',
         role: 'Research Director',
         company: 'ScienceHub',
         content: "Beautiful, intuitive, powerful. It's rare to find all three in one app.",
         rating: 5,
      },
   ];

   const fadeInUp = {
      initial: { opacity: 0, y: 60 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6 },
   };

   const staggerContainer = {
      animate: {
         transition: {
            staggerChildren: 0.1,
         },
      },
   };

   return (
      <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
         {/* Header */}
         <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex justify-between items-center h-16">
                  {/* Logo */}
                  <motion.div
                     className="flex items-center space-x-3"
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ duration: 0.5 }}
                  >
                     <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
                        <HiCheckCircle className="h-6 w-6 text-white" />
                     </div>
                     <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Smart Todo
                     </span>
                  </motion.div>

                  {/* Desktop Navigation */}
                  <nav className="hidden md:flex items-center space-x-8">
                     <a
                        href="#features"
                        className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                     >
                        Features
                     </a>
                     <a
                        href="#pricing"
                        className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                     >
                        Pricing
                     </a>
                     <a
                        href="#security"
                        className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                     >
                        Security
                     </a>
                     <Link
                        to="/auth/login"
                        className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                     >
                        Sign In
                     </Link>
                     <Link
                        to="/auth/register"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                     >
                        Get Started Free
                     </Link>
                  </nav>

                  {/* Mobile Menu Button */}
                  <button
                     className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                     onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                     {isMenuOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
                  </button>
               </div>

               {/* Mobile Menu */}
               {isMenuOpen && (
                  <motion.div
                     className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700"
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     exit={{ opacity: 0, height: 0 }}
                  >
                     <div className="flex flex-col space-y-4">
                        <a
                           href="#features"
                           className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                           Features
                        </a>
                        <a
                           href="#pricing"
                           className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                           Pricing
                        </a>
                        <a
                           href="#security"
                           className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                           Security
                        </a>
                        <Link
                           to="/auth/login"
                           className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        >
                           Sign In
                        </Link>
                        <Link
                           to="/auth/register"
                           className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg text-center"
                        >
                           Get Started Free
                        </Link>
                     </div>
                  </motion.div>
               )}
            </div>
         </header>

         {/* Hero Section */}
         <section className="pt-24 pb-20 bg-gradient-to-br from-[#9406E6] to-[#00FFFF] dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Left Content */}
                  <motion.div
                     className="text-center lg:text-left"
                     initial={{ opacity: 0, x: -50 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ duration: 0.8 }}
                  >
                     <motion.h1
                        className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                     >
                        Transform{' '}
                        <span className="bg-gradient-to-r from-yellow-400 via-pink-500 to-red-400 bg-clip-text text-transparent drop-shadow-lg">
                           Chaos
                        </span>{' '}
                        Into{' '}
                        <span className="bg-gradient-to-r from-green-400 via-cyan-500 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
                           Clarity
                        </span>
                     </motion.h1>

                     <motion.p
                        className="text-xl text-gray-800 dark:text-gray-100 mb-8 leading-relaxed font-semibold drop-shadow"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                     >
                        The intelligent task manager that adapts to how you work – from simple tasks to complex project
                        workflows with real-time collaboration.
                     </motion.p>

                     <motion.div
                        className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                     >
                        <Link
                           to="/auth/register"
                           className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                           <span>Start Organizing Smarter</span>
                           <HiArrowRight className="h-5 w-5" />
                        </Link>
                        <button className="border-2 border-purple-600 text-purple-600 dark:text-purple-400 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-600 hover:text-white transition-all duration-200 flex items-center justify-center space-x-2">
                           <HiPlay className="h-5 w-5" />
                           <span>Watch Demo</span>
                        </button>
                     </motion.div>

                     <motion.div
                        className="flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-gray-800 dark:text-gray-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                     >
                        <div className="flex items-center space-x-2">
                           <HiCheckCircle className="h-5 w-5 text-green-500" />
                           <span>Smart task dependencies</span>
                        </div>
                        {/* <div className="flex items-center space-x-2">
                           <HiCheckCircle className="h-5 w-5 text-green-500" />
                           <span>Real-time collaboration</span>
                        </div>
                        <div className="flex items-center space-x-2">
                           <HiCheckCircle className="h-5 w-5 text-green-500" />
                           <span>AI-powered insights</span>
                        </div> */}
                     </motion.div>
                  </motion.div>

                  {/* Right Content - Interactive Demo */}
                  <motion.div
                     className="relative"
                     initial={{ opacity: 0, x: 50 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ duration: 0.8, delay: 0.4 }}
                  >
                     <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
                        {/* Mock App Interface */}
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Tasks</h3>
                              <div className="flex space-x-2">
                                 <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                                 <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                 <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                              </div>
                           </div>

                           {[1, 2, 3, 4].map((item, index) => (
                              <motion.div
                                 key={item}
                                 className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                 initial={{ opacity: 0, x: 20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                              >
                                 <div className="w-4 h-4 border-2 border-purple-400 rounded"></div>
                                 <div className="flex-1">
                                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mt-1"></div>
                                 </div>
                                 <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full"></div>
                              </motion.div>
                           ))}
                        </div>

                        {/* Floating Elements */}
                        <motion.div
                           className="absolute -top-4 -right-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 rounded-lg shadow-lg"
                           animate={{ y: [0, -10, 0] }}
                           transition={{ duration: 2, repeat: Infinity }}
                        >
                           <HiBell className="h-5 w-5" />
                        </motion.div>

                        <motion.div
                           className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-lg shadow-lg"
                           animate={{ y: [0, 10, 0] }}
                           transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        >
                           <HiUsers className="h-5 w-5" />
                        </motion.div>
                     </div>
                  </motion.div>
               </div>
            </div>
         </section>

         {/* Features Section */}
         <section id="features" className="py-20 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <motion.div className="text-center mb-16" {...fadeInUp}>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                     Powerful Features for Modern Teams
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                     Everything you need to manage tasks, collaborate with teams, and boost productivity in one
                     intelligent platform.
                  </p>
               </motion.div>

               <motion.div
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                  variants={staggerContainer}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
               >
                  {features.map((feature, index) => (
                     <motion.div
                        key={index}
                        className="group relative bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer"
                        variants={fadeInUp}
                        onHoverStart={() => setActiveFeature(index)}
                     >
                        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${feature.color} mb-4`}>
                           <feature.icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{feature.description}</p>
                        <motion.div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                     </motion.div>
                  ))}
               </motion.div>
            </div>
         </section>

         {/* How It Works Section */}
         <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <motion.div className="text-center mb-16" {...fadeInUp}>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300">Get started in three simple steps</p>
               </motion.div>

               <div className="grid md:grid-cols-3 gap-8">
                  {[
                     {
                        step: '01',
                        title: 'Brain Dump',
                        description: 'Add all your tasks effortlessly with our intuitive interface',
                        icon: HiLightBulb,
                     },
                     {
                        step: '02',
                        title: 'Connect',
                        description: 'Link related tasks and set dependencies to optimize workflow',
                        icon: HiUsers,
                     },
                     {
                        step: '03',
                        title: 'Execute',
                        description: 'Let the smart system guide your workflow and boost productivity',
                        icon: HiChartBar,
                     },
                  ].map((step, index) => (
                     <motion.div
                        key={index}
                        className="text-center"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.2 }}
                        viewport={{ once: true }}
                     >
                        <div className="relative mb-6">
                           <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                              <step.icon className="h-8 w-8 text-white" />
                           </div>
                           <div className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 text-purple-600 font-bold text-sm px-2 py-1 rounded-full border-2 border-purple-600">
                              {step.step}
                           </div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
                     </motion.div>
                  ))}
               </div>
            </div>
         </section>

         {/* Testimonials Section */}
         <section className="py-20 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <motion.div className="text-center mb-16" {...fadeInUp}>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                     Trusted by Productive Teams Worldwide
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300">
                     See what our users have to say about their experience
                  </p>
               </motion.div>

               <div className="grid md:grid-cols-3 gap-8">
                  {testimonials.map((testimonial, index) => (
                     <motion.div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        viewport={{ once: true }}
                     >
                        <div className="flex items-center mb-4">
                           {[...Array(testimonial.rating)].map((_, i) => (
                              <HiStar key={i} className="h-5 w-5 text-yellow-400" />
                           ))}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-4 italic">"{testimonial.content}"</p>
                        <div>
                           <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                           <p className="text-sm text-gray-500 dark:text-gray-400">
                              {testimonial.role}, {testimonial.company}
                           </p>
                        </div>
                     </motion.div>
                  ))}
               </div>
            </div>
         </section>

         {/* Pricing Section */}
         <section
            id="pricing"
            className="py-20 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900"
         >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <motion.div className="text-center mb-16" {...fadeInUp}>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                     Simple, Transparent Pricing
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300">Choose the plan that fits your needs</p>
               </motion.div>

               <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {[
                     {
                        name: 'Free',
                        price: '$0',
                        period: 'forever',
                        features: [
                           'Unlimited personal tasks',
                           'Basic collaboration (3 members)',
                           'Standard notifications',
                           'Mobile & web access',
                        ],
                        cta: 'Get Started Free',
                        popular: false,
                     },
                     {
                        name: 'Pro',
                        price: '$9',
                        period: 'per month',
                        features: [
                           'Unlimited team collaboration',
                           'Advanced analytics',
                           'Priority support',
                           'Custom integrations',
                           'Advanced reminders',
                        ],
                        cta: 'Start Pro Trial',
                        popular: true,
                     },
                     {
                        name: 'Enterprise',
                        price: 'Custom',
                        period: 'contact us',
                        features: [
                           'Advanced security',
                           'Custom deployment',
                           'Dedicated support',
                           'SLA guarantee',
                           'Custom features',
                        ],
                        cta: 'Contact Sales',
                        popular: false,
                     },
                  ].map((plan, index) => (
                     <motion.div
                        key={index}
                        className={`relative bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border-2 ${
                           plan.popular ? 'border-purple-500 scale-105' : 'border-gray-200 dark:border-gray-700'
                        }`}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        viewport={{ once: true }}
                     >
                        {plan.popular && (
                           <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                              <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                 Most Popular
                              </span>
                           </div>
                        )}

                        <div className="text-center mb-8">
                           <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                           <div className="mb-4">
                              <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                              <span className="text-gray-600 dark:text-gray-300 ml-2">{plan.period}</span>
                           </div>
                        </div>

                        <ul className="space-y-4 mb-8">
                           {plan.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-center space-x-3">
                                 <HiCheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                 <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                              </li>
                           ))}
                        </ul>

                        <button
                           className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                              plan.popular
                                 ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transform hover:scale-105'
                                 : 'border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white'
                           }`}
                        >
                           {plan.cta}
                        </button>
                     </motion.div>
                  ))}
               </div>
            </div>
         </section>

         {/* Security Section */}
         <section id="security" className="py-20 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <motion.div className="text-center mb-16" {...fadeInUp}>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                     Your Data, Secured
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-300">Enterprise-grade security you can trust</p>
               </motion.div>

               <div className="flex flex-wrap justify-center gap-8">
                  {[
                     {
                        icon: HiShieldCheck,
                        title: 'End-to-End Encryption',
                        description: 'Your data is encrypted in transit and at rest',
                     },
                     {
                        icon: HiGlobeAlt,
                        title: 'GDPR Compliant',
                        description: 'Full compliance with global privacy regulations',
                     },
                     {
                        icon: HiClock,
                        title: '99.9% Uptime',
                        description: 'Reliable service with guaranteed availability',
                     },
                     // {
                     //    icon: HiShieldCheck,
                     //    title: 'SOC 2 Certified',
                     //    description: 'Independently verified security controls',
                     // },
                  ].map((item, index) => (
                     <motion.div
                        key={index}
                        className="text-center flex-1 min-w-[220px] max-w-xs"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        viewport={{ once: true }}
                     >
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                           <item.icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                     </motion.div>
                  ))}
               </div>
            </div>
         </section>
         <section className="py-20 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
               <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
               >
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Transform How You Work?</h2>
                  <p className="text-xl text-white/90 mb-8">
                     Join thousands of productive teams who've already made the switch
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                     <Link
                        to="/auth/register"
                        className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
                     >
                        <span>Start Your Free Account</span>
                        <HiArrowRight className="h-5 w-5" />
                     </Link>
                     <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-purple-600 transition-all duration-200">
                        Schedule Demo
                     </button>
                  </div>
                  <p className="text-white/70 mt-4 text-sm">
                     No credit card required • Upgrade anytime • Cancel anytime
                  </p>
               </motion.div>
            </div>
         </section>

         {/* Footer */}
         <footer className="bg-gray-900 text-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="grid md:grid-cols-4 gap-8">
                  <div>
                     <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
                           <HiCheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-bold">Smart Todo</span>
                     </div>
                     <p className="text-gray-400 mb-4">
                        The intelligent task manager that transforms chaos into clarity.
                     </p>
                     <div className="flex space-x-4">{/* Social media icons would go here */}</div>
                  </div>

                  {/* product */}
                  <div>
                     <h4 className="font-semibold mb-4"></h4>
                     <ul className="space-y-2 text-gray-400">
                        <li>
                           <a href="#features" className="hover:text-white transition-colors">
                              Features
                           </a>
                        </li>
                        <li className="relative group">
                           <a href="#" className="hover:text-white transition-colors cursor-pointer flex items-center">
                              Updates
                              {/* Down arrow icon */}
                              <svg
                                 className="ml-1 w-4 h-4 fill-current"
                                 viewBox="0 0 20 20"
                                 xmlns="http://www.w3.org/2000/svg"
                              >
                                 <path d="M5.25 7.5l4.5 4.5 4.5-4.5H5.25z" />
                              </svg>
                           </a>

                           {/* Dropdown menu */}
                           <ul className="absolute left-0 mt-2 w-40 bg-slate-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200 z-10">
                              <li>
                                 <a
                                    href="#"
                                    className="block px-4 py-2 hover:bg-purple-700 rounded-md transition-colors"
                                 >
                                    Version 2.0
                                 </a>
                              </li>
                              <li>
                                 <a
                                    href="#"
                                    className="block px-4 py-2 hover:bg-purple-700 rounded-md transition-colors"
                                 >
                                    Version 3.1 mega
                                 </a>
                              </li>
                           </ul>
                        </li>
                     </ul>
                  </div>

                  <div>
                     <h4 className="font-semibold mb-4"></h4>
                     <ul className="space-y-2 text-gray-400">
                        <li>
                           <a href="#pricing" className="hover:text-white transition-colors">
                              Pricing
                           </a>
                        </li>
                        {/* <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                       Help Center
                                    </a>
                                 </li>
                                 <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                       API Docs
                                    </a>
                                 </li>
                                 <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                       Blog
                                    </a>
                                 </li>
                                 <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                       Templates
                                    </a>
                                 </li> */}
                     </ul>
                  </div>

                  <div>
                     <h4 className="font-semibold mb-4"></h4>
                     <ul className="space-y-2 text-gray-400">
                        <li>
                           <a href="#security" className="hover:text-white transition-colors">
                              Security
                           </a>
                        </li>
                        {/* <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                       About
                                    </a>
                                 </li>
                                 <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                       Careers
                                    </a>
                                 </li>
                                 <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                       Contact
                                    </a>
                                 </li>
                                 <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                       Press
                                    </a>
                                 </li> */}
                     </ul>
                  </div>
               </div>

               <div className="border-t border-gray-800 mt-4 pt-8 flex flex-col md:flex-row justify-between items-center">
                  <p className="text-gray-400 text-sm">© 2024 Smart Todo. All rights reserved.</p>
                  <div className="flex space-x-6 mt-4 md:mt-0">
                     <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                        Privacy Policy
                     </a>
                     <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                        Terms of Service
                     </a>
                     <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                        Cookie Policy
                     </a>
                  </div>
               </div>
            </div>
         </footer>
      </div>
   );
};

export default LandingPage;
